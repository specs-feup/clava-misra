import { Call, Joinpoint, Program, FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { addExternFunctionDecl, getCallsToLibrary, getExternFunctionDecls, getIncludesOfFile, isValidFile } from "../../utils/FileUtils.js";
import { findFunctionDef } from "../../utils/FunctionUtils.js";
import UserConfigurableRule from "../UserConfigurableRule.js";
/**
 * 
 * Abstract base class for MISRA-C rules that prohibit the use of specific standard library functions.
 *
 * Need to implement/define:
 *  - analysisType
 *  - standardLibrary
 *  - invalidFunctions
 *  - name() 
 */
export default abstract class DisallowedStdLibFunctionRule extends UserConfigurableRule {
    priority = 1;
    protected invalidFiles = new Map<FileJp, Call[]>();
    protected abstract standardLibrary: string;
    protected abstract invalidFunctions: string[];

    /**
     * Specifies the scope of analysis: single unit or entire system.
     */
    abstract readonly analysisType: AnalysisType;

    abstract override get name(): string;

    protected getErrorMsgPrefix(callJp: Call): string {
        return `Function '${callJp.name}' of <${this.standardLibrary}> shall not be used.`
    }

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
        const filesJps = Query.search(FileJp, (fileJp) => {return getIncludesOfFile(fileJp).includes(this.standardLibrary)}).get();
        let nonCompliant = false;

        for (const fileJp of filesJps) {
            const invalidCalls = getCallsToLibrary(fileJp, this.standardLibrary, this.invalidFunctions);
            if (invalidCalls.length > 0) {
                this.invalidFiles.set(fileJp, invalidCalls);
                nonCompliant = true; 

                if (logErrors) {
                    invalidCalls.forEach(callJp => this.logMISRAError(callJp, this.getErrorMsgPrefix(callJp)));
                } 
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
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
    
        let changedDescendant = false;

        for (const [fileJp, invalidCalls] of this.invalidFiles) {
            if (this.solveDisallowedFunctions(fileJp, invalidCalls)) {
                changedDescendant = true;
            }
        }

        if (changedDescendant) {
            this.rebuildProgram();
            return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
        } else {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }

    private solveDisallowedFunctions(fileJp: FileJp, invalidCalls: Call[]): boolean {
        let externFunctions = getExternFunctionDecls(fileJp).map(funcJp => funcJp.definitionJp.astId);
        let changedFile = false;

        for (const callJp of invalidCalls) {
            if (this.context.getRuleResult(this.ruleID, callJp) === MISRATransformationType.NoChange) {
                continue;
            }

            const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
            const configFix: Map<string, string> | undefined = this.getFixFromConfig(callJp);
            if (!configFix) {
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
                continue;
            }

            const replacement_func = configFix.get("function");
            const location = configFix.get("location");
            const functionDef = findFunctionDef(replacement_func!, location!);
            if (!functionDef) {
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided file \'${location}\' does not have function definition.`);
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
                continue;
            }
            
            console.log("found func: ", functionDef.code);

            let externDecl: Joinpoint | undefined;
            if (!externFunctions.includes(functionDef.astId)) {
                externDecl = addExternFunctionDecl(fileJp, functionDef);

                if (externDecl === undefined) {
                    this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not have external linkage.`);
                    this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
                    continue;
                }
            }

            const previousCallName = callJp.name;
            callJp.setName(functionDef.name);
            if (isValidFile(fileJp)) {
                changedFile = true;
                externFunctions.push(functionDef.astId);
            } else {
                externDecl?.detach();
                callJp.setName(previousCallName);
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${location}\' does not fix the violation.`);
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
            }
        }

        return changedFile;
    }
}
