import { Call, FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getFilesWithCallToImplicitFunction, getIncludesOfFile, isCallToImplicitFunction, isValidFile, removeIncludeFromFile } from "../../utils/utils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

/**
 * MISRA Rule 17.3: A function shall not be declared implicitly
 */
export default class Rule_17_3_ImplicitFunction extends MISRARule {
    priority = 1;

    constructor(context: MISRAContext) {
        super("17.3", context);
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
        for (const callJp of implicitCalls) {
            if (logErrors) {
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
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);

        const programJp = $jp as Program;
        const filesWithImplicitCall = getFilesWithCallToImplicitFunction(programJp);
        let changedDescendant = false;

        for (const fileJp of filesWithImplicitCall) {
            changedDescendant = changedDescendant || this.solveImplicitCalls(fileJp);
        }

        if (changedDescendant) {
            programJp.rebuild();
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
    private getImplicitFixFromConfig(callJp: Call, errorMsgPrefix: string): string | undefined {
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
        let addedIncludes: string[] = [];
        let changedFile = false;

        for (const callJp of implicitCalls) {
            const errorMsgPrefix = `Function '${callJp.name}' is declared implicitly.`;
            
            if (solvedCalls.has(callJp.name)) {
                continue;
            } 
            
            const configFix = this.getImplicitFixFromConfig(callJp, errorMsgPrefix);
            if (!configFix) {
                continue;
            }

            const callIndex = Query.searchFrom(fileJp, Call, { name: callJp.name }).get().findIndex(c => c.equals(callJp));
            const isInclude = configFix.endsWith(".h");
            if (isInclude) {
                if (originalIncludes.includes(configFix)) {
                    this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${configFix}\' does not fix the violation.`);
                } 
                else if (addedIncludes.includes(configFix)) {
                    
                    if (this.isValidFileWithExplicitCall(fileJp, callJp.name, callIndex)) {
                        solvedCalls.add(callJp.name);
                    } else {
                        this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${configFix}\' does not fix the violation.`);
                    }
                } 
                else {
                    fileJp.addInclude(configFix);
                    const fileCompiles = this.isValidFileWithExplicitCall(fileJp, callJp.name, callIndex);

                    if (fileCompiles) {
                        solvedCalls.add(callJp.name);
                        addedIncludes.push(configFix);
                        changedFile = true;
                    } else {
                        removeIncludeFromFile(configFix, fileJp);
                        this.logMISRAError(callJp, `${errorMsgPrefix} Provided include \'${configFix}\' does not fix the violation.`);
                    }
                }
            }
        }
        return changedFile;
    }

    /**
     * Checks if the rebuilt version of the file compiles and if the provided call is no longer implicit
     * @param fileJp The file to analyze
     * @param funcName The function name to search the call
     * @param callIndex The index of the call 
     */
    private isValidFileWithExplicitCall(fileJp: FileJp, funcName: string, callIndex: number) {
        const programJp = fileJp.parent as Program;
        let copyFile = ClavaJoinPoints.fileWithSource(`temp_misra_${fileJp.name}`, fileJp.code, fileJp.relativeFolderpath);
    
        copyFile = programJp.addFile(copyFile) as FileJp;
        try {
            const rebuiltFile = copyFile.rebuild();
            const fileToRemove = Query.searchFrom(programJp, FileJp, {filepath: rebuiltFile.filepath}).first() as FileJp;
            const callJp = Query.searchFrom(fileToRemove, Call, {name: funcName}).get().at(callIndex);
            const isExplicitCall = callJp !== undefined && !isCallToImplicitFunction(callJp);

            fileToRemove?.detach();
            return isExplicitCall;

        } catch(error) {
            copyFile.detach();
            return false;
        }
    }
}
