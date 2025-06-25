import { Call, Joinpoint, Program, FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { addExternFunctionDecl, getExternFunctionDecls, getIncludesOfFile, isValidFile } from "../../utils/FileUtils.js";
import { rebuildProgram } from "../../utils/ProgramUtils.js";
import { findFunctionDef } from "../../utils/FunctionUtils.js";

/**
 * 
 * Abstract base class for MISRA-C rules that prohibit the use of specific standard library functions.
 *
 * Need to implement/define:
 *  - standardLibrary
 *  - invalidFunctions
 *  - name() 
 */
export default abstract class DisallowedStdLibFunctionRule extends MISRARule {
    priority = 1;
    protected invalidFiles: FileJp[] = [];
    protected abstract standardLibrary: string;
    protected abstract invalidFunctions: string[];

    constructor(context: MISRAContext) {
        super(context);
    }

    abstract override get name(): string;

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
       if (!($jp instanceof Program)) return false;

        this.invalidFiles = Query.search(FileJp, (fileJp) => {return getIncludesOfFile(fileJp).includes(this.standardLibrary)}).get();
        let nonCompliant = false;

        for (const fileJp of this.invalidFiles) {
            const invalidCalls = Query.searchFrom(fileJp, Call, (callJp) => {return this.invalidFunctions.includes(callJp.name) && callJp.function.isInSystemHeader}).get();
            if (invalidCalls.length > 0) {
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

        for (const fileJp of this.invalidFiles) {
            if (this.solveDisallowedFunctions(fileJp)) {
                changedDescendant = true;
            }
        }

        if (changedDescendant) {
            rebuildProgram();
            return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
        } else {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }

    protected getErrorMsgPrefix(callJp: Call): string {
        return `Function '${callJp.name}' of <${this.standardLibrary}> shall not be used.`
    }

    protected override getFixFromConfig(callJp: Call, errorMsgPrefix: string): Map<string, string> | undefined {
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

        if (!location || !replacement_func) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Couldn't add extern due to incomplete configuration for function \'${callJp.name}\' of standard library <${this.standardLibrary}>.`);
            return undefined;
        }
        return new Map([
            ["function", replacement_func],
            ["location", location]
        ]);

    }

    private solveDisallowedFunctions(fileJp: FileJp): boolean {
        const invalidCalls = Query.searchFrom(fileJp, Call, (callJp) => {return this.invalidFunctions.includes(callJp.name) && callJp.function.isInSystemHeader}).get();
        let externFunctions = getExternFunctionDecls(fileJp).map(funcJp => funcJp.definitionJp.astId);
        let changedFile = false;

        for (const callJp of invalidCalls) {
            if (this.context.getRuleResult(this.ruleID, callJp) === MISRATransformationType.NoChange) {
                continue;
            }

            const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
            const configFix: Map<string, string> | undefined = this.getFixFromConfig(callJp, errorMsgPrefix);
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
            
            let externDecl: Joinpoint | undefined;
            if (!externFunctions.includes(functionDef.astId)) {
                externDecl = addExternFunctionDecl(fileJp, functionDef);

                if (!externDecl) {
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
