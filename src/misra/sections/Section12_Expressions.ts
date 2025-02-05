import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, BinaryOp, Joinpoint, Op, Loop, Expression } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";

export default class Section12_Expressions extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;
    
    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r12_1_explicitPrecedence.bind(this)],
            [3, this.r12_3_noCommaOperator.bind(this)]
        ]);
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
        for (const bOp of Query.searchFrom($startNode, BinaryOp, {isAssignment: false})) {
            if ((bOp.kind === "ptr_mem_d" || bOp.kind === "ptr_mem_i")
                || (!bOp.getAncestor("binaryOp") && !bOp.getAncestor("ternaryOp"))
                || (bOp.parent instanceof BinaryOp && bOp.parent.isAssignment)
                || (bOp.parent instanceof Op && Section12_Expressions.isSamePrecedence(bOp.kind, bOp.parent.kind))
                || (bOp.parent.instanceOf("parenExpr"))) continue;
    
            this.logMISRAError(bOp, `Operator precedence in expression ${bOp.code} is not explicit.`, new Fix(bOp, ($jp: Joinpoint) => {
                const parenExpr = ClavaJoinPoints.parenthesis($jp as Expression);
                bOp.replaceWith(parenExpr);
            }));
        }
    }

    private r12_3_noCommaOperator($startNode: Joinpoint) {
        Query.searchFrom($startNode, BinaryOp, {operator: ','}).get().forEach(op => {
            const loopAncestor = op.getAncestor("loop");
            if (loopAncestor instanceof Loop && (loopAncestor?.step?.contains(op) || loopAncestor?.cond?.contains(op) || loopAncestor?.init?.contains(op))) {
                console.log(`Cannot eliminate comma operator in expression ${op.code} since it is at the head of a loop.`);
                this.logMISRAError(op, "Use of the comma operator is not allowed.");
            }
            else {
                this.logMISRAError(op, "Use of the comma operator is not allowed.", new Fix(op, ($jp: Joinpoint) => {
                    $jp.insertBefore(($jp as BinaryOp).left.stmt);
                    $jp.replaceWith(($jp as BinaryOp).right);
                }));
            }
        }, this);
    }
}