import Query from "lara-js/api/weaver/Query.js";
import { Program, FileJp, GotoStmt, Joinpoint, LabelStmt, Break } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser, { T } from "../MISRAAnalyser.js";
import ResultList from "clava-js/api/clava/analysis/ResultList.js";

export default class Section15_ControlFlow extends MISRAAnalyser {
    protected processRules($startNode: T): void {
        const labelMap = new Map();
        const exits = new Map<string, number>();
        const nodes = new Map<string, Joinpoint>();
        if (this.rules.has(3) || this.rules.has(4)) {
            Query.searchFrom($startNode, LabelStmt).get().forEach(stmt => labelMap.set(stmt.decl.astId, stmt.astId));
        }
        if (this.rules.has(4)) {    
            Section15_ControlFlow.addBreaksToExits($startNode, exits, nodes);
        }

        Query.searchFrom($startNode, GotoStmt).get().forEach(goto => {
            if (this.rules.has(1)) {
                this.r15_1_noGoto(goto);
            }

            if (this.rules.has(2)) {
                this.r15_2_noBackJumps(goto);
            }

            if (this.rules.has(3)) {
                this.r15_3_gotoBlockEnclosed(goto, labelMap);
            }
            if (this.rules.has(4)) {
                Section15_ControlFlow.addGotoToExits(goto, exits, nodes, labelMap);
            }
        }, this);

        if (this.rules.has(4)) {
            this.r15_4_loopSingleBreak(exits, nodes);
        }
    }
    
    constructor(rules: number[]) {
        super(rules);
    }

    private r15_1_noGoto($goto: GotoStmt) {
        this.logMISRAError($goto, "goto statements should not be used.")
    }

    private static isBeforeInCode(line1: number, col1: number, line2: number, col2: number): boolean {
        if (line1 < line2) return true;
        else return col1 < col2;
    }

    private r15_2_noBackJumps($goto: GotoStmt) {
        if (!Section15_ControlFlow.isBeforeInCode($goto.line, $goto.column, $goto.label.line, $goto.label.column)) {
            this.logMISRAError($goto, "Back jumps using goto statements are not allowed.");
        }
    }

    private r15_3_gotoBlockEnclosed($gotoStmt: GotoStmt, $labelMap: Map<string, string>) { 
        let curr = $gotoStmt.getAncestor("scope");
        const ancestor = $gotoStmt.getAncestor("function");
        let error = true;
        let temp;

        do {
            temp = curr;
            if (curr.children.map(n => n.astId).includes($labelMap.get($gotoStmt.label.astId) ?? "")) {
                error = false;
                break;
            }
            curr = curr.getAncestor("scope");
        } while (temp.parent.astId !== ancestor.astId);

        if (error) {
            this.logMISRAError($gotoStmt, `Label ${$gotoStmt.label.name} is not declared in a block enclosing the goto statement.`);
        }
    }

    private static addBreaksToExits($startNode: Joinpoint, exits: Map<string, number>, nodes: Map<string, Joinpoint>) {
        for (const goto of Query.searchFrom($startNode, Break)) {
            const ancestor = goto.getAncestor("loop");
            if (ancestor && exits.has(ancestor.astId)) {
                exits.set(ancestor.astId, (exits.get(ancestor.astId) ?? 0) + 1);
            }
            else if (ancestor) {
                exits.set(ancestor.astId, 1);
                nodes.set(ancestor.astId, ancestor);
            }
        }
    }
    
    private static addGotoToExits($gotoStmt: GotoStmt, exits: Map<string, number>, nodes: Map<string, Joinpoint>, labels: Map<string, Joinpoint>) {
        let ancestor = $gotoStmt.getAncestor("loop");
        const labelAncestor = labels.get($gotoStmt.label.astId)?.getAncestor("loop");

        while (ancestor) {
            if (labelAncestor?.astId === ancestor.astId) break;


            if (ancestor && exits.has(ancestor.astId)) {
                exits.set(ancestor.astId, (exits.get(ancestor.astId) ?? 0) + 1);
            }
            else if (ancestor) {
                exits.set(ancestor.astId, 1);
                nodes.set(ancestor.astId, ancestor);
            }

            ancestor = ancestor.getAncestor("loop");
        }
    }

    private r15_4_loopSingleBreak($exits: Map<string, number>, $nodes: Map<string, Joinpoint>) {
        $exits.forEach((v, k) => {
            if (v > 1) {
                this.logMISRAError($nodes.get(k) as Joinpoint, "Loops should have at most one break/goto statement.")
            }
        }, this);
    }
}