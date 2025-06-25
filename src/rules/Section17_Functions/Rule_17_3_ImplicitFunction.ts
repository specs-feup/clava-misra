import { Call, FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { findFunctionDef } from "../../utils/FunctionUtils.js";
import { getCallIndex, isCallToImplicitFunction } from "../../utils/CallUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { addExternFunctionDecl, getFilesWithCallToImplicitFunction, getIncludesOfFile, isValidFileWithExplicitCall, removeIncludeFromFile } from "../../utils/FileUtils.js";
import { rebuildProgram } from "../../utils/ProgramUtils.js";

/**
 * MISRA Rule 17.3: A function shall not be declared implicitly
 */
export default class Rule_17_3_ImplicitFunction extends MISRARule {
    priority = 1;

    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "17.3";
    }

    /**
     * Checks if the given joinpoint represents a call to an implicit function.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;
        
        const implicitCalls = Query.searchFrom($jp, Call, (callJp) => isCallToImplicitFunction(callJp)). get();
        if (logErrors) {
            for (const callJp of implicitCalls) {
                this.logMISRAError(callJp, `Function '${callJp.name}' is declared implicitly.`);
            }
        }
        
        return implicitCalls.length > 0;
    }

    /**
     * Transforms every implicit call by adding a missing include directive or extern statement specified on the config file.
     * 
     * - If the configuration is missing or the specified fix is invalid (i.e., not a '.h' or '.c'), no transformation is performed and the call is left unchanged.
     * - The fix is applied only if it successfully resolves the issue (i.e., makes the call explicit and the file compiles with no error).
     * - Otherwise, the fix is removed.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const filesWithImplicitCall = getFilesWithCallToImplicitFunction($jp as Program);
        let changedDescendant = false;

        for (const fileJp of filesWithImplicitCall) {
            if (this.solveImplicitCalls(fileJp)) {
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

    /**
     * Retrieves the fix for a implicit call specified on the config file (.h or .c)
     * @param callJp 
     * @param errorMsgPrefix 
     * @returns 
     */
    protected override getFixFromConfig(callJp: Call, errorMsgPrefix: string): string | undefined {
        if (!this.context.config) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Include or extern not added due to missing config file.`);
            return undefined;
        }
    
        let configFix: string | undefined;
        try {
            configFix = this.context.config.get("implicitCalls")[callJp.name];
        } catch {
            this.logMISRAError(callJp, `${errorMsgPrefix} Include or extern was not added as \'implicitCalls\' is not defined in the configuration file.`);
            return undefined;
        }
    
        if (configFix === undefined) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Couldn't add include or extern due to missing configuration for function '${callJp.name}'.`);
            return undefined;
        }
    
        if (!(configFix.endsWith(".h") || configFix.endsWith(".c"))) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Cannot add include or extern without a .h or .c reference.`);
            return undefined;
        }
        return configFix;
    }

    /**
     * Attempts to resolve implicit function calls in a file by adding missing includes or extern statements based on the configuration file.
     * @param fileJp The file to analyze
     * @returns `true` if any changes were made to the file, otherwise `false`.
     */
    private solveImplicitCalls(fileJp: FileJp): boolean {
        const implicitCalls = Query.searchFrom(fileJp, Call, (callJp) => (isCallToImplicitFunction(callJp))).get();
        const originalIncludes = getIncludesOfFile(fileJp);
        let solvedCalls = new Set<string>();
        let addedIncludes = new Set<string>();
        let changedFile = false;

        for (const callJp of implicitCalls) {   
            if (this.context.getRuleResult(this.ruleID, callJp) === MISRATransformationType.NoChange) {
                continue;
            }
            
            if (solvedCalls.has(callJp.name)) {
                continue;
            } 

            const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
            const configFix = this.getFixFromConfig(callJp, errorMsgPrefix);
            if (!configFix) {
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
                continue;
            }

            const callIndex = getCallIndex(fileJp, callJp);
            const isInclude = configFix.endsWith(".h");
            const success = isInclude ? 
                this.solveWithInclude(fileJp, callJp, configFix, originalIncludes, addedIncludes, callIndex) :
                this.solveWithExtern(fileJp, callJp, configFix, callIndex);

            if (success) {
                solvedCalls.add(callJp.name);
                changedFile = true;
                if (isInclude) {
                    addedIncludes.add(configFix);
                }
            } else {
                this.context.addRuleResult(this.ruleID, callJp, MISRATransformationType.NoChange);
            }
        }
        return changedFile;
    }

    private getErrorMsgPrefix(callJp: Call): string {
        return `Function '${callJp.name}' is declared implicitly.`;
    }

    private solveWithInclude(
        fileJp: FileJp, 
        callJp: Call, 
        includePath: string, 
        originalIncludes: string[], 
        addedIncludes: Set<string>, 
        callIndex: number
    ): boolean {
        const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
        let success = false;

        if (originalIncludes.includes(includePath)) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${includePath}\' does not fix the violation.`);
        } 
        else if (addedIncludes.has(includePath)) {
            
            if (isValidFileWithExplicitCall(fileJp, callJp.name, callIndex)) {
                success = true;
            } else {
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${includePath}\' does not fix the violation.`);
            }
        } 
        else {
            fileJp.addInclude(includePath);
            const fileCompiles = isValidFileWithExplicitCall(fileJp, callJp.name, callIndex);

            if (fileCompiles) {
                success = true;
            } else {
                removeIncludeFromFile(includePath, fileJp);
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${includePath}\' does not fix the violation.`);
            }
        }
        return success;
    }

    private solveWithExtern(fileJp: FileJp, callJp: Call, functionLocation: string, callIndex: number): boolean {
        const errorMsgPrefix = this.getErrorMsgPrefix(callJp);
        const functionDef = findFunctionDef(callJp.name, functionLocation);
        let success = false;

        if (!functionDef) {
            this.logMISRAError(callJp, `${errorMsgPrefix} Provided file \'${functionLocation}\' does not have function definition.`);
        } else {
            const externDecl = addExternFunctionDecl(fileJp, functionDef);

            if (!externDecl) {
                this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${functionLocation}\' does not have external linkage.`);
            } else {
                const fileCompiles = isValidFileWithExplicitCall(fileJp, callJp.name, callIndex, true);
                if (fileCompiles) {
                    success = true;
                } else {
                    externDecl.detach();
                    this.logMISRAError(callJp, `${errorMsgPrefix} Provided definition at \'${functionLocation}\' does not fix the violation.`);
                }
            }
        }
        return success;
    }
}