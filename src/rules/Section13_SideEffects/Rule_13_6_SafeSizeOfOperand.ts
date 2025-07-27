import { BinaryOp, Call, FileJp, Joinpoint, ParenExpr, UnaryExprOrType, UnaryOp, VariableArrayType, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getVolatileVarRefs } from "../../utils/VarUtils.js";
import { isValidFile } from "../../utils/FileUtils.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

/**
 * MISRA Rule 13.6: The operand of the sizeof operator shall not contain any expression which has potential side effects
 */
export default class Rule_13_6_SafeSizeOfOperand extends MISRARule {   
    private modifyingExpressions: (UnaryOp | BinaryOp)[] = [];
    private functionCalls: Call[] = [];
    private volatileRefs: Varref[] = [];
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "13.6";
    }

    private operandIsVariableArrayType($jp: UnaryExprOrType) {
        return $jp.argType != undefined && $jp.argType instanceof VariableArrayType;
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof UnaryExprOrType && $jp.kind === "sizeof")) {
            return false;
        }

        this.functionCalls = Query.searchFromInclusive($jp, Call).get();
        this.volatileRefs = this.operandIsVariableArrayType($jp) ? getVolatileVarRefs(($jp.argType as VariableArrayType).sizeExpr) : [];
        this.modifyingExpressions = [
            ...Query.searchFromInclusive($jp, UnaryOp,  {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}).get(), 
            ...Query.searchFromInclusive($jp, BinaryOp, {kind: /(assign)|(add_assign)|(sub_assign)|(mul_assign)|(div_assign)|(rem_assign)|(shl_assign)|(shr_assign)|(and_assign)|(xor_assign)|(or_assign)/}).get()
        ];

        const isNonCompliant = this.functionCalls.length > 0 || this.modifyingExpressions.length > 0 || this.volatileRefs.length > 0;

        if (isNonCompliant && logErrors) {
            this.functionCalls.forEach(call => {
                this.logMISRAError(call, `Function call '${call.name}' in sizeof is not allowed because it has no effect.`);
            });

            this.modifyingExpressions.forEach(expr => {
                this.logMISRAError(expr, `Modifying expression '${expr.code}' in sizeof is not allowed because it has no effect.`);
            });

            this.volatileRefs.forEach(ref => {
                this.logMISRAError(ref, `Access to volatile object ${ref.name} in sizeof is not allowed.`);
            });
        } 

        return isNonCompliant;        
    }

    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        if (!this.operandIsVariableArrayType($jp as UnaryExprOrType)) {
            for (const callJp of this.functionCalls) {
                const callAncestor = callJp.getAncestor("call");
                if (callAncestor === undefined || callAncestor.depth < $jp.depth) {
                    const functionType = callJp.functionType.returnType;
                    const fileJp = callJp.getAncestor("file") as FileJp;
                    const tempJp = fileJp.lastChild.insertAfter(ClavaJoinPoints.stmtLiteral(`static int _temp_misra_var = sizeof(${functionType.code});`));
                    const jpIndex = Query.searchFrom(fileJp, UnaryExprOrType).get().length;

                    let newSizeOf = isValidFile(fileJp, UnaryExprOrType, jpIndex) as UnaryExprOrType;
                    newSizeOf = $jp.replaceWith(newSizeOf) as UnaryExprOrType;
                    newSizeOf.setArgType(functionType);
                    tempJp.detach();
                    return new MISRATransformationReport(MISRATransformationType.Replacement, newSizeOf);
                }
            }

            for (const expr of this.modifyingExpressions) {
                let varRef = expr instanceof BinaryOp ? 
                    expr.left : Query.searchFrom(expr, Varref).get()[0];
                expr.replaceWith(varRef);
            }
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } 
        else {
            this.functionCalls.forEach(call => {
                this.logMISRAError(call, `Function call '${call.name}' in sizeof is not allowed. Could not correct because it is used to define a variable-length array type and it is unspecified whether it will be evaluated or not.`);
            });

            this.modifyingExpressions.forEach(expr => {
                this.logMISRAError(expr, `Modifying expression '${expr.code}' in sizeof is not allowed. Could not correct because it is used to define a variable-length array type and it is unspecified whether it will be evaluated or not.`);
            });

            this.volatileRefs.forEach(ref => {
                this.logMISRAError(ref,`Access to volatile object '${ref.name}' in sizeof is not allowed. Could not correct because it is used to define a variable-length array type and it is unspecified whether it will be evaluated or not.`);
            });
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }
}
