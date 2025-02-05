import Query from "@specs-feup/lara/api/weaver/Query.js";
import AnalyserResult from "@specs-feup/clava/api/clava/analysis/AnalyserResult.js";
import { Program, FileJp, Joinpoint, Varref, Call, QualType, Vardecl, UnaryOp, InitList, BinaryOp } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import TraversalType from "@specs-feup/lara/api/weaver/TraversalType.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";

export default class Section13_SideEffects extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;
    
    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r13_1_initListSideEffects.bind(this)],
            [3, this.r13_3_noIncrementSideEffects.bind(this)],
            [4, this.r13_4_noUseOfAssignmentValue.bind(this)],
            [5, this.r13_5_shortCircuitSideEffects.bind(this)]
        ]);
    }

    private checkPotentialPersistentSideEffects<T>($startNode: Joinpoint, type: any, filters: any, name: string, childFun: ($jp: T) => Joinpoint) {
        Query.searchFrom($startNode, type, filters).get().forEach(list => {
            Query.searchFromInclusive(childFun(list), Varref).get().forEach(ref => {
                if (ref.type instanceof QualType && ref.type.qualifiers?.includes("volatile")) {
                    this.logMISRAError(list, `${name} ${list.code} contains persistent side effects: an access to volatile object ${ref.name}.`)
                }
            }, this); 
            Query.searchFromInclusive(childFun(list), Call).get().forEach(call => {
                this.logMISRAError(list, `${name} ${list.code} may contain persistent side effects in call to ${call.name}.`);
            }, this);
            Query.searchFromInclusive(childFun(list), UnaryOp, {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}).get().forEach(op => { //use chain?
                Query.searchFrom(op, Varref).get().forEach(ref => {
                    if (ref.declaration instanceof Vardecl && ref.declaration.isGlobal) {
                        this.logMISRAError(list, `${name} ${list.code} may contain persistent side effects in expression ${op.code}.`)
                    } 
                });
            }, this);
        }, this); 
    }

    private r13_1_initListSideEffects($startNode: Joinpoint) {
        this.checkPotentialPersistentSideEffects<Joinpoint>($startNode, InitList, undefined, "Initializer list", jp => jp);
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
            else Section13_SideEffects.visitAllExprs(fun, temp.children[0]);
        }
    }
    
    private checkIncrementSideEffects(exprRoot: Joinpoint) { //something wierd but mostly working if not for duplicates
        const jps = Query.searchFrom(exprRoot, UnaryOp, {kind: /(post_inc)|(post_dec)|(pre_inc)|(pre_dec)/}, TraversalType.POSTORDER).get();
        const calls = Query.searchFromInclusive(exprRoot, Call).get();
        const assignments = Query.searchFromInclusive(exprRoot, BinaryOp, {isAssignment: true}).get();
        if (jps.length + calls.length + assignments.length < 2) return;

        this.logMISRAError(exprRoot, `Expression ${exprRoot.code} contains a pre/post inc/decrement operator and other side effects.`, new Fix(exprRoot, ($jp: Joinpoint) => {
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
                console.log(jp);
                jp.replaceWith(jp.operand);
            }
        }));
    }

    private r13_3_noIncrementSideEffects($startNode: Joinpoint) {
        Section13_SideEffects.visitAllExprs(this.checkIncrementSideEffects, $startNode);
    }

    private r13_4_noUseOfAssignmentValue($startNode: Joinpoint) {
        for (const bOp of Query.searchFrom($startNode, BinaryOp, {isAssignment: true})) {
            if (!bOp.parent.instanceOf("exprStmt") && !(bOp.parent.instanceOf("parenExpr") && bOp.parent?.parent?.instanceOf("exprStmt"))) {
                this.logMISRAError(bOp, `Value of assignment expression ${bOp.code} should not be used.`);
            }
        }
    }

    private r13_5_shortCircuitSideEffects($startNode: Joinpoint) {
        this.checkPotentialPersistentSideEffects<BinaryOp>($startNode, BinaryOp, {operator: /(\&\&|\|\|)/}, "RHS of && or || expression", jp => jp.right);
    }
}