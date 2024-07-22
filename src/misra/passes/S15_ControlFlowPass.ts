import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { Break, GotoStmt, Joinpoint, LabelStmt, Loop } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";

export default class S15_ControlFlowPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];
    private _labelMap: Map<string, Joinpoint> | undefined;

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r15_1_noGoto.bind(this)],
            [2, this.r15_2_noBackJumps.bind(this)],
            [3, this.r15_3_gotoBlockEnclosed.bind(this)],
            [4, this.r15_4_loopSingleBreak.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof GotoStmt || $jp instanceof Loop;
    }

    private r15_1_noGoto($startNode: Joinpoint) {
        if (!($startNode instanceof GotoStmt)) return;
        //log error
    }

    private static isBeforeInCode(line1: number, col1: number, line2: number, col2: number): boolean {
        if (line1 < line2) return true;
        else return col1 < col2;
    }

    private r15_2_noBackJumps($startNode: Joinpoint) {
        if (!($startNode instanceof GotoStmt)) return;
        if (!S15_ControlFlowPass.isBeforeInCode($startNode.line, $startNode.column, $startNode.label.line, $startNode.label.column)) {
            //log error
        } 
    }

    private computeLabelMap() {
        this._labelMap = new Map();
        Query.search(LabelStmt).get().forEach(stmt => this._labelMap?.set(stmt.decl.astId, stmt), this);
    }

    private r15_3_gotoBlockEnclosed($startNode: Joinpoint) { 
        if (!($startNode instanceof GotoStmt)) return;
        if (!this._labelMap) this.computeLabelMap();

    
        let curr = $startNode.getAncestor("scope");
        const ancestor = $startNode.getAncestor("function");
        let error = true;
        let temp;

        do {
            temp = curr;
            if (curr.children.map(n => n.astId).includes(this._labelMap?.get($startNode.label.astId)?.astId as string)) {
                error = false;
                break;
            }
            curr = curr.getAncestor("scope");
        } while (temp.parent.astId !== ancestor.astId);

        if (error) {
            //log error
        }
    }

    private static countBreakExits($startNode: Joinpoint): number {
        let count = 0;
        for (const goto of Query.searchFrom($startNode, Break)) {
            const ancestor = goto.getAncestor("loop");
            const switchAncestor = goto.getAncestor("switch");
            if (ancestor.astId === $startNode.astId && !$startNode.contains(switchAncestor)) {
                count++;
            }
        }

        return count;
    }
    
    private static countGotoExits($startNode: Joinpoint, labels: Map<string, Joinpoint>) {
        let count = 0;
        for (const goto of Query.searchFrom($startNode, GotoStmt)) {
            if (!($startNode.contains(labels.get(goto.label.astId) as Joinpoint))) {
                count++;
            }
        }

        return count;
    }

    private r15_4_loopSingleBreak($startNode: Joinpoint) {
        if (!($startNode instanceof Loop)) return;
        if (!this._labelMap) this.computeLabelMap();
    
        const breakExits = S15_ControlFlowPass.countBreakExits($startNode);
        const gotoExits = S15_ControlFlowPass.countGotoExits($startNode, this._labelMap as Map<string, Joinpoint>);

        if (breakExits + gotoExits > 1) {
            //log error
        }
    }

    protected _name: string = "Control Flow";
    
}