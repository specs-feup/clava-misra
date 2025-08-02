import { Call, Joinpoint, Program, FileJp, Include } from "@specs-feup/clava/api/Joinpoints.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { addExternFunctionDecl, findFilesReferencingHeader, getCallsToLibrary, getExternFunctionDecls, getIncludesOfFile, isValidFile } from "../../utils/FileUtils.js";
import { findFunctionDef } from "../../utils/FunctionUtils.js";
import UserConfigurableRule from "../UserConfigurableRule.js";

/**
 * 
 * Abstract base class for MISRA-C rules that prohibit the use of function of a standard library.
 *
 * Need to implement/define:
 *  - analysisType
 *  - standardLibrary
 *  - invalidFunctions
 *  - name() 
 */
export default abstract class DisallowedStdLibFunctionRule extends UserConfigurableRule {
    /**
     *  A positive integer starting from 1 that indicates the rule's priority, determining the order in which rules are applied.
     */
    readonly priority = 1;

    /**
     * A map that keeps track of invalid usages found in each file.
     */
    protected invalidFiles = new Map<FileJp, Call[]>();

    /**
     * The name of the standard library 
     */
    protected abstract standardLibrary: string;

    /**
     * Names of functions from {@link standardLibrary} that forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected abstract invalidFunctions: Set<string>;

    /**
     * Specifies the scope of analysis: single unit or entire system.
     */
    abstract readonly analysisType: AnalysisType;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    abstract override get name(): string;

    /**
     * Checks if all functions of the library are forbidden
     */
    private isLibraryFullyDisallowed(): boolean {
        return this.invalidFunctions.size === 0;
    }

    /**
     * Logs a MISRA error if all functions of the library are forbidden 
     * @param fileJp 
     * @returns 
     */
    private logDisallowedInclude(fileJp: FileJp) {
        if (!this.isLibraryFullyDisallowed()) { // Only specific functions are forbidden
            return;
        } 
        const includeJp = Query.searchFrom(fileJp, Include, {name: this.standardLibrary}).get()[0];
        this.logMISRAError(includeJp, `The system header file <${includeJp.name}> shall not be used.`);
        this.context.addRuleResult(this.ruleID, includeJp, MISRATransformationType.NoChange);
    }

    /**
     * Returns the prefix to be used for error messages related to the given joinpoint
     * 
     * @param $jp - Joinpoint where the violation was detected 
     * @returns Returns a prefix to prepend to error messages if no configuration is specified or if the configuration does not contain a fix for this violation
     */
    protected getErrorMsgPrefix(callJp: Call): string {
        return `Function '${callJp.name}' of <${this.standardLibrary}> shall not be used.`
    }

    /**
     * Retrieves a fix for the given joinpoint using the provided configuration file
     * @param $jp - Joinpoint where the violation was detected
     * @return The fix retrieved from the configuration for the violation, or `undefined` if no applicable fix is found.
     */
    protected getFixFromConfig(callJp: Call): Map<string, string> | undefined {
        const errorMsgPrefix = this.getErrorMsgPrefix(callJp);

        if (!this.context.config) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Extern not added due to missing config file.`);
            return undefined;
        }

        let configFix = this.context.config.get("disallowedFunctions");
        if (!configFix) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Extern was not added as \'disallowedFunctions\' is not defined in the configuration file.`);
            return undefined;
        } 

        if (!configFix[this.standardLibrary]) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Couldn't add extern due to missing configuration for standard library <${this.standardLibrary}>.`);
            return undefined;
        }

        if (!configFix[this.standardLibrary][callJp.name]) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Couldn't add extern due to missing configuration for function \'${callJp.name}\' of standard library <${this.standardLibrary}>.`);
            return undefined;
        }

        const location = configFix[this.standardLibrary][callJp.name]["location"];
        const replacement_func = configFix[this.standardLibrary][callJp.name]["replacement"];

        if (location === undefined || replacement_func === undefined) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Couldn't add extern due to incomplete configuration for function \'${callJp.name}\' of standard library <${this.standardLibrary}>.`);
            return undefined;
        }
        return new Map([
            ["function", replacement_func],
            ["location", location]
        ]);
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program && this.appliesToCurrentStandard())) return false;

        this.invalidFiles = new Map<FileJp, Call[]>();
        const referencingFiles = findFilesReferencingHeader(this.standardLibrary);
        let nonCompliant = false;

        for (const fileJp of referencingFiles) {
            const invalidCalls = getCallsToLibrary(fileJp, this.standardLibrary, this.invalidFunctions);
            
            if (invalidCalls.length > 0 || this.isLibraryFullyDisallowed()) {
                this.invalidFiles.set(fileJp, invalidCalls);
                nonCompliant = true;
            }
            if (logErrors) {
                invalidCalls.forEach(callJp => this.logMISRAError(callJp, this.getErrorMsgPrefix(callJp)));
                this.logDisallowedInclude(fileJp);
            } 
        }
        return nonCompliant;
    }

    /**
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
    
        let changedDescendant = false;
        for (const [fileJp, invalidCalls] of this.invalidFiles) {
            if (this.solveDisallowedFunctions(fileJp, invalidCalls)) {
                changedDescendant = true;
            }
        }

        // Rebuild AST if any file changed
        if (changedDescendant) { 
            this.rebuildProgram();
            return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
        }
        return new MISRATransformationReport(MISRATransformationType.NoChange);
    }

    private solveDisallowedFunctions(fileJp: FileJp, invalidCalls: Call[]): boolean {
        let externFunctions = this.getExternFunctionDeclIds(fileJp);
        let changedFile = false;
        let solvedCallsCount = 0;

        for (const callJp of invalidCalls) {
            if (this.solveDisallowedFunctionCall(callJp, fileJp, externFunctions)) {
                changedFile = true;
                solvedCallsCount++;
            }
        }

        // Try to remove the include 
        const fixedAllCalls = solvedCallsCount === invalidCalls.length;
        this.removeInclude(fileJp, fixedAllCalls);

        return changedFile;
    }

    private solveDisallowedFunctionCall(callJp: Call, fileJp: FileJp, externFunctions: Set<string>): boolean {
        // Skip call if previous AST visit marked it as unfixable
        if (this.context.getRuleResult(this.ruleID, callJp) === MISRATransformationType.NoChange) {
            return false;
        }

        const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
        const configFix = this.getFixFromConfig(callJp);
       
        // Skip if config file was not specified or provides an invalid fix
        if (!configFix) { 
            this.logDisallowedInclude(fileJp);
            this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
            return false;
        }

        const [location, replacement_func] = [configFix.get("location"), configFix.get("function")];
        const functionDef = findFunctionDef(replacement_func!, location!);

        // Skip if specified function doesn't exist
        if (!functionDef) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Provided file \'${location}\' does not have function definition.`);
            this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
            return false;
        }

        // Skip if specified function doesn't have external linkage
        let externDecl: Joinpoint | undefined;
        if (!externFunctions.has(functionDef.astId)) {
            externDecl = addExternFunctionDecl(fileJp, functionDef);

            if (externDecl === undefined) {
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not have external linkage.`);
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
                return false;
            }
        }

        const previousCallName = callJp.name;
        callJp.setName(functionDef.name);
        if (isValidFile(fileJp)) {
            externFunctions.add(functionDef.astId);
            return true;
        } else { // If file does not compile, remove added external declaration and mark call as unfixable
            externDecl?.detach();
            callJp.setName(previousCallName);
            this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not fix the violation.`);
            this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
            return false;
        }
    }

    private getExternFunctionDeclIds(fileJp: FileJp): Set<string> {
        return new Set(
          getExternFunctionDecls(fileJp)
            .filter((funcJp) => funcJp.definitionJp !== undefined)
            .map((funcJp) => funcJp.definitionJp.astId)
        );
    }

    /**
     * Removes the standard library include if it is fully disallowed and all invalid calls were fixed.
     * If the file is invalid after include removal  because other library features are still being used (e.g.: typedefs), the include is re-added.
     * 
     * @param fileJp The file to modify
     * @param fixedAllCalls Flag to indicate whether all calls were fixed
     */
    private removeInclude(fileJp: FileJp, fixedAllCalls: boolean) {
        const includeJp = Query.searchFrom(fileJp, Include, {name: this.standardLibrary}).get()[0];
        const ruleResult = this.context.getRuleResult(this.ruleID, includeJp);

        if (this.isLibraryFullyDisallowed() && ruleResult === undefined) {            
            if (!fixedAllCalls) { // Keep include and log MISRA error
                this.logDisallowedInclude(fileJp);
            } 
            else { 
                includeJp.detach();

                // Re-add include and log error if any other library features are still referenced
                if (!isValidFile(fileJp)) { 
                    fileJp.addInclude(this.standardLibrary, true);
                    this.logDisallowedInclude(fileJp);
                }
            }
        }
    }
}
