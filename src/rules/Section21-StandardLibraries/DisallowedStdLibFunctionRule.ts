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
     * Calls that could not be resolved and their respective error message, stored to prevent repeated attempts of correction after rebuild.
     */
    protected unresolvedCalls: Map<string, string> = new Map<string, string>();

    /**
     * Files where headers were kept because other library features are still used.
     */
    protected filesWithRetainedHeaders: Set<string> = new Set<string>();

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
     * Logs a MISRA error when the entire library is disallowed and 
     * records the file to track headers that must be retained.
     * 
     * @param fileJp - The file in which the disallowed include was found.
     */
    private logDisallowedInclude(fileJp: FileJp) {
        if (!this.isLibraryFullyDisallowed()) { // Only specific functions are forbidden
            return;
        } 
        const includeJp = Query.searchFrom(fileJp, Include, {name: this.standardLibrary}).get()[0];
        this.logMISRAError(includeJp, `The system header file <${includeJp.name}> shall not be used.`);
        this.context.addRuleResult(this.ruleID, includeJp, MISRATransformationType.NoChange);
        
        if (!this.filesWithRetainedHeaders.has(fileJp.name)) {
            this.filesWithRetainedHeaders.add(fileJp.name);
        }
    }

    /**
     * Logs a MISRA error for a disallowed function call and records
     * the call along with its error message to avoid repeated attempts
     * 
     * @param callJp - The disallowed function call 
     * @param msg - Description of the violation
     */
    private logDisallowedCall(callJp: Call, msg: string) {
        this.logMISRAError(callJp, msg);
        this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
        if (!this.unresolvedCalls.has(callJp.name)) {
            this.unresolvedCalls.set(callJp.name, msg);
        }
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
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Extern not added due to missing config file.`);
            return undefined;
        }

        let configFix = this.context.config.get("disallowedFunctions");
        if (!configFix) {
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Extern was not added as \'disallowedFunctions\' is not defined in the configuration file.`);
            return undefined;
        } 

        if (!configFix[this.standardLibrary]) {
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Couldn't add extern due to missing configuration for standard library <${this.standardLibrary}>.`);
            return undefined;
        }

        if (!configFix[this.standardLibrary][callJp.name]) {
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Couldn't add extern due to missing configuration for function \'${callJp.name}\' of standard library <${this.standardLibrary}>.`);
            return undefined;
        }

        const location = configFix[this.standardLibrary][callJp.name]["location"];
        const replacement_func = configFix[this.standardLibrary][callJp.name]["replacement"];

        if (location === undefined || replacement_func === undefined) {
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Couldn't add extern due to incomplete configuration for function \'${callJp.name}\' of standard library <${this.standardLibrary}>.`);
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
        let solvedCalls = new Map<string, string>();

        for (const callJp of invalidCalls) {
            if (this.solveDisallowedFunctionCall(callJp, fileJp, externFunctions, solvedCalls)) {
                changedFile = true;
                solvedCallsCount++;
            }
        }

        // Try to remove the include 
        const fixedAllCalls = solvedCallsCount === invalidCalls.length;
        this.removeInclude(fileJp, fixedAllCalls);

        return changedFile;
    }

    private solveDisallowedFunctionCall(callJp: Call, fileJp: FileJp, externFunctions: Set<string>, solvedCalls: Map<string, string>): boolean {
        if (solvedCalls.has(callJp.name)) {
            callJp.setName(solvedCalls.get(callJp.name)!);
            return true;
        }
        
        // Skip call if previous AST visit marked it as unfixable
        if (this.context.getRuleResult(this.ruleID, callJp) === MISRATransformationType.NoChange) {
            return false;
        }

        // Skip call if previous visits, before rebuild, marked it as unfixable
        if (this.unresolvedCalls.has(callJp.name)) {
            this.logDisallowedCall(callJp, this.unresolvedCalls.get(callJp.name)!);
        }

        const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
        const configFix = this.getFixFromConfig(callJp);
       
        // Skip if config file was not specified or provides an invalid fix
        if (!configFix) { 
            return false;
        }

        const [location, replacement_func] = [configFix.get("location"), configFix.get("function")];
        const functionDef = findFunctionDef(replacement_func!, location!);

        // Skip if specified function doesn't exist
        if (!functionDef) {
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Provided file \'${location}\' does not have function definition.`);
            return false;
        }

        // Skip if specified function doesn't have external linkage
        let externDecl: Joinpoint | undefined;
        if (!externFunctions.has(functionDef.astId)) {
            externDecl = addExternFunctionDecl(fileJp, functionDef);

            if (externDecl === undefined) {
                this.logDisallowedCall(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not have external linkage.`);
                return false;
            }
        }

        const previousCallName = callJp.name;
        callJp.setName(functionDef.name);
        if (isValidFile(fileJp)) {
            externFunctions.add(functionDef.astId);
            solvedCalls.set(previousCallName, functionDef.name);
            return true;
        } else { // If file does not compile, remove added external declaration and mark call as unfixable
            externDecl?.detach();
            callJp.setName(previousCallName);
            this.logDisallowedCall(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not fix the violation.`);
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
        if (!this.isLibraryFullyDisallowed()) return;

        const includeJp = Query.searchFrom(fileJp, Include, {name: this.standardLibrary}).get()[0];
        const ruleResult = this.context.getRuleResult(this.ruleID, includeJp);

        if (ruleResult !== undefined) return;
          
        if (this.filesWithRetainedHeaders.has(fileJp.name) || !fixedAllCalls) { // Keep include and log MISRA error 
            this.logDisallowedInclude(fileJp);
        } else { 
            includeJp.detach();

            // Re-add include and log error if any other library features are still referenced
            if (!isValidFile(fileJp)) { 
                fileJp.addInclude(this.standardLibrary, true);
                this.logDisallowedInclude(fileJp);
            }
        }
    }
}
