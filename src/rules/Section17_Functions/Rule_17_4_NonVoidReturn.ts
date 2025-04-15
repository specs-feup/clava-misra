import { BuiltinType, Call, EnumDecl, ExprStmt, FileJp, FunctionJp, Joinpoint, Program, ReturnStmt } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * MISRA Rule 17.4: All exit paths from a function with non-void return type shall have an
explicit return statement with an expression. In a non-void function:
- Every return statement has an expression, and a 
- Control cannot reach the end of the function without encountering a return statement
 */
export default class Rule_17_4_NonVoidReturn extends MISRARule {
    constructor(context: MISRAContext) {
        super("17.4", context);
    }

    /**
     * Checks if the given joinpoint represents a non-void function that lacks an explicit return statement with an expression.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp && $jp.isImplementation)) return false;

        if ($jp.returnType instanceof BuiltinType && $jp.returnType.isVoid) return false;

        const emptyReturnStms = Query.searchFrom($jp, ReturnStmt, {returnExpr: undefined}).get();
        const exitReturn = $jp.body.children.filter(child => child instanceof ReturnStmt && !emptyReturnStms.includes(child))[0];
        if (logErrors) {
            emptyReturnStms?.forEach(emptyReturn =>
                this.logMISRAError(emptyReturn, "Every return statement in a non-void function must include an expression.")
            )
            if (exitReturn === undefined) {
                this.logMISRAError($jp, `Function '${$jp.name}' reaches the end without a return statement.`)
            }
        }
        return emptyReturnStms.length > 0 || exitReturn === undefined;
    }

    /**
     * Checks if the newly added return statement is valid by attempting to rebuild the file that contains it.
     * If rebuilding fails, the return statement is considered invalid.
     * 
     * @param returnStmt - The return statement to validate.
     */
    private isValidReturnStmt(returnStmt: ReturnStmt) : boolean {
        const fileJp = returnStmt.getAncestor("file") as FileJp;
        const programJp = fileJp.parent as Program;
        let copyFile = (fileJp.deepCopy() as FileJp);
        copyFile.setName(`temp_misra_${copyFile.name}`);

        copyFile = programJp.addFile(copyFile) as FileJp;
        try {
            const rebuiltFile = copyFile.rebuild();
            const fileToRemove = Query.searchFrom(programJp, FileJp, {filepath: rebuiltFile.filepath}).first();
            fileToRemove?.detach();
            return true;
        } catch(error) {
            copyFile.detach();
            return false;
        }
    }

    /**
     * Transforms a non-void function joinpoint that has no return statement at the end, by adding a default return value based on the config file.
     * - If the configuration file is missing/invalid or the specified default value is invalid, no transformation is performed and the function is left unchanged.
     * - Otherwise, a return statement is inserted as the last statement of the function. 
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const functionJp = $jp as FunctionJp;
        const returnType = functionJp.type.code;
        const errorMsgPrefix = `Function '${functionJp.name}' reaches the end without a return statement.`;

        if (!this.context.config) {
            this.logMISRAError($jp, `${errorMsgPrefix} Default value return not added due to missing config file.`)
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        let defaultValueReturn;
        try {
            defaultValueReturn = this.context.config.get("defaultValues")[returnType];
        } catch (error) {  
            this.logMISRAError($jp, `${errorMsgPrefix} Default value return not added due to invalid structure of configuration file.`);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        if (defaultValueReturn === undefined) {
            this.logMISRAError($jp, `${errorMsgPrefix} Default value return not added due to missing default value configuration for type '${returnType}'.`);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        // Insert return statement and validate it
        const returnStmt = ClavaJoinPoints.returnStmt(ClavaJoinPoints.exprLiteral(String(defaultValueReturn), functionJp.returnType)) as ReturnStmt;
        functionJp.body.lastChild ? functionJp.body.lastChild.insertAfter(returnStmt) : functionJp.body.setFirstChild(returnStmt);

        // Validate the provided default value. If it is invalid, the return stmt is removed
        if (this.isValidReturnStmt(returnStmt)) {
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } 
        returnStmt.detach();
        this.logMISRAError($jp, `${errorMsgPrefix} Provided default value for type '${functionJp.type.code}' is invalid and was therefore not inserted.`);
        return new MISRATransformationReport(MISRATransformationType.NoChange);
    }
}
