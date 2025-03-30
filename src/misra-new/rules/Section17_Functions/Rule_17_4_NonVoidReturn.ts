import { BuiltinType, Call, EnumDecl, ExprStmt, FunctionJp, Joinpoint, ReturnStmt } from "@specs-feup/clava/api/Joinpoints.js";
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
     * Transforms a non-void function joinpoint that has no return statement at the end, by adding a default return value based on the config file.
     * - If the configuration file is is missing or invalid, no transformation is performed.
     * - Otherwise, a return statement is inserted as the last statement of the function. 
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const functionJp = $jp as FunctionJp;
        if (this.context.config) {
            try {
                const returnType = functionJp.type.code;
                const defaultValueReturn = this.context.config.get("defaultValues")[returnType];

                if (defaultValueReturn === undefined) {
                    this.logMISRAError($jp, `Function '${functionJp.name}' reaches the end without a return statement. Default value return not added due to missing default value configuration for type '${returnType}'.`);
                    return new MISRATransformationReport(MISRATransformationType.NoChange);
                }
                const newJp = ClavaJoinPoints.returnStmt(ClavaJoinPoints.exprLiteral(String(defaultValueReturn), functionJp.returnType)) as ReturnStmt;
                functionJp.body.lastChild ? functionJp.body.lastChild.insertAfter(newJp) : functionJp.body.setFirstChild(newJp);

                return new MISRATransformationReport(MISRATransformationType.DescendantChange);
            
            } catch (error) {  
                this.logMISRAError($jp, `Function '${functionJp.name}' reaches the end without a return statement. Default value return not added due to invalid structure of configuration file.`);
                return new MISRATransformationReport(MISRATransformationType.NoChange);
            }
        }   
        this.logMISRAError($jp, `Function '${functionJp.name}' reaches the end without a return statement. Default value return not added due to missing config file.`)
        return new MISRATransformationReport(MISRATransformationType.NoChange);
    }
}
