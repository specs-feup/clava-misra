import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BinaryOp, Expression, Joinpoint, Loop, Op } from "clava-js/api/Joinpoints.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "clava-js/api/clava/ClavaJoinPoints.js";

export default class S12_ExpressionPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r12_1_explicitPrecedence.bind(this)],
            [3, this.r12_3_noCommaOperator.bind(this)]
        ]);
    }
    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof BinaryOp && !$jp.isAssignment;
    }

    private static isAdditive(op: string): boolean {
        return op === "add" || op === "sub";
    }
    
    private static isMultiplicative(op: string): boolean {
        return op === "mul" || op === "div" || op === "rem";
    }
    
    private static isShift(op: string): boolean {
        return op === "shl" || op === "shr";
    }
    
    private static isRelational(op: string): boolean {
        return op === "lt" || op === "gt" || op === "le" || op === "ge";
    }
    
    private static isEquality(op: string): boolean {
        return op === "eq" || op === "ne";
    }
    
    private static isSamePrecedence(op1: string, op2: string): boolean {
        if (op1 === op2) return true;
        
        for (const fun of [this.isAdditive, this.isMultiplicative, this.isShift, this.isRelational, this.isEquality]) {
            if (fun(op1) && fun(op2)) {
                return true;
            }
        }
    
        return false;
    }

    private r12_1_explicitPrecedence($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp)) return;

        if (($startNode.kind === "ptr_mem_d" || $startNode.kind === "ptr_mem_i")
            || (!$startNode.getAncestor("binaryOp") && !$startNode.getAncestor("ternaryOp"))
            || ($startNode.parent instanceof BinaryOp && $startNode.parent.isAssignment)
            || ($startNode.parent instanceof Op && S12_ExpressionPass.isSamePrecedence($startNode.kind, $startNode.parent.kind))
            || ($startNode.parent.instanceOf("parenExpr"))) return;

        this.logMISRAError(`Operator precedence in expression ${$startNode.code} is not explicit.`, new Fix($startNode, ($jp: Joinpoint) => {
            const parenExpr = ClavaJoinPoints.parenthesis($jp as Expression);
            $jp.replaceWith(parenExpr);
        }));
    }

    private r12_3_noCommaOperator($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp && $startNode.operator === ",")) return;

        const loopAncestor = $startNode.getAncestor("loop");
        if (loopAncestor instanceof Loop && (loopAncestor?.step?.contains($startNode) || loopAncestor?.cond?.contains($startNode) || loopAncestor?.init?.contains($startNode))) {
            console.log(`Cannot eliminate comma operator in expression ${$startNode.code} since it is at the head of a loop.`);
            this.logMISRAError("Use of the comma operator is not allowed.");
        }
        else {
            this.logMISRAError("Use of the comma operator is not allowed.", new Fix($startNode, ($jp: Joinpoint) => {
                $jp.insertBefore(($jp as BinaryOp).left.stmt);
                $jp.replaceWith(($jp as BinaryOp).right);
            }));
        }
    }

    protected _name: string = "Expressions";
    
}