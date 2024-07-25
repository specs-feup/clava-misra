import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import Query from "lara-js/api/weaver/Query.js";
import { BinaryOp, Call, ExprStmt, InitList, Joinpoint, QualType, UnaryExprOrType, UnaryOp, Vardecl, Varref } from "clava-js/api/Joinpoints.js";
import TraversalType from "lara-js/api/weaver/TraversalType.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

export default class S13_SideEffectPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r13_1_initListSideEffects.bind(this)],
            [3, this.r13_3_noIncrementSideEffects.bind(this)],
            [4, this.r13_4_noUseOfAssignmentValue.bind(this)],
            [5, this.r13_5_shortCircuitSideEffects.bind(this)],
            [6, this.r13_6_sizeofSideEffects.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof InitList || $jp instanceof ExprStmt || $jp instanceof BinaryOp || $jp instanceof UnaryExprOrType;
    }

    private checkPotentialPersistentSideEffects<T extends Joinpoint>($startNode: T, name: string, childFun: ($jp: T) => Joinpoint) {
        Query.searchFromInclusive(childFun($startNode), Varref).get().forEach(ref => {
            if (ref.type instanceof QualType && ref.type.qualifiers?.includes("volatile")) {
                this.logMISRAError(`${name} ${$startNode.code} contains persistent side effects: an access to volatile object ${ref.name}.`)
            }
        }, this); 
        Query.searchFromInclusive(childFun($startNode), Call).get().forEach(call => {
            this.logMISRAError(`${name} ${$startNode.code} may contain persistent side effects in call to ${call.name}.`);
        }, this);
        Query.searchFromInclusive(childFun($startNode), UnaryOp, {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}).get().forEach(op => { //use chain?
            Query.searchFrom(op, Varref).get().forEach(ref => {
                if (ref.declaration instanceof Vardecl && ref.declaration.isGlobal) {
                    this.logMISRAError(`${name} ${$startNode.code} may contain persistent side effects in expression ${op.code}.`)
                } 
            });
        }, this);
    }

    private r13_1_initListSideEffects($startNode: Joinpoint) {
        if (!($startNode instanceof InitList)) return;

        this.checkPotentialPersistentSideEffects<Joinpoint>($startNode, "Initializer list", jp => jp);
    }

    private static visitAllExprs(fun: ($jp: Joinpoint) => void, root: Joinpoint) {
        let curr = root;
        while (curr) {
            const temp = curr;
            //console.log(temp.joinPointType);
            curr = curr.rightJp;
            if (temp.instanceOf("expression")) {
                fun(temp);
            }
            else S13_SideEffectPass.visitAllExprs(fun, temp.children[0]);
        }
    }
    
    private checkIncrementSideEffects(exprRoot: Joinpoint) {
        const jps = Query.searchFrom(exprRoot, UnaryOp, {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}, TraversalType.POSTORDER).get();
        //THE ABOVE LINE ONLY WORKS BECAUSE SEARCH FROM IS RETURNING THE ROOT, SEARCH FROM INCLUSIVE RETURNS IT TWICE
        const calls = Query.searchFromInclusive(exprRoot, Call).get();
        const assignments = Query.searchFromInclusive(exprRoot, BinaryOp, {isAssignment: true}).get();
        if (jps.length == 0 || jps.length + calls.length + assignments.length < 2) return;

        this.logMISRAError(`Expression ${exprRoot.code} contains a pre/post inc/decrement operator and other side effects.`, new Fix(exprRoot, ($jp: Joinpoint) => {
            const jps = Query.searchFrom($jp, UnaryOp, {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}, TraversalType.POSTORDER).get();
            const calls = Query.searchFromInclusive($jp, Call).get();
            const assignments = Query.searchFromInclusive($jp, BinaryOp, {isAssignment: true}).get();

            const transformationNo = (calls.length === 0 && assignments.length === 0) ? jps.length - 1 : jps.length;

            for (let i = 0; i < transformationNo; i++) {
                const jp = jps[i];
                if (/post_.*/.test(jp.kind)) {
                    $jp.insertAfter(jp.deepCopy());
                }
                else {
                    $jp.insertBefore(jp.deepCopy());
                }
                jp.replaceWith(jp.operand);
            }
        }));
    }

    private r13_3_noIncrementSideEffects($startNode: Joinpoint) { //not working for decls
        if (!($startNode instanceof ExprStmt)) return;
        
        this.checkIncrementSideEffects($startNode.expr);

        //S13_SideEffectPass.visitAllExprs(this.checkIncrementSideEffects.bind(this), $startNode.expr);
    }

    private r13_4_noUseOfAssignmentValue($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp && $startNode.isAssignment)) return;

        if (!$startNode.parent.instanceOf("exprStmt") && !($startNode.parent.instanceOf("parenExpr") && $startNode.parent?.parent?.instanceOf("exprStmt"))) {
            this.logMISRAError(`Value of assignment expression ${$startNode.code} should not be used.`);
        }
    }

    private r13_5_shortCircuitSideEffects($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp && /(\&\&|\|\|)/.test($startNode.operator))) return;

        this.checkPotentialPersistentSideEffects<BinaryOp>($startNode, "RHS of && or || expression", jp => jp.right);
    }

    private r13_6_sizeofSideEffects($startNode: Joinpoint) {
        if (!($startNode instanceof UnaryExprOrType && $startNode.hasArgExpr)) return;

        //TODO: exception for volatile qualified lvalue that is not a variable length array
        this.checkPotentialPersistentSideEffects<Joinpoint>($startNode.argExpr, "Sizeof operand", jp => jp);
    }

    protected _name: string = "Side effects";
    
}