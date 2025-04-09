import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, GotoStmt, Joinpoint, LabelStmt, Break } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section15_ControlFlow extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;
    
    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["15.1", this.r15_1_noGoto.bind(this)],
            ["15.2", this.r15_2_noBackJumps.bind(this)],
            ["15.3", this.r15_3_gotoBlockEnclosed.bind(this)],
            ["15.4", this.r15_4_loopSingleBreak.bind(this)]
        ]);
    }

    private r15_1_noGoto($startNode: Joinpoint) {
        Query.searchFrom($startNode, GotoStmt).get().forEach(goto => this.logMISRAError(this.currentRule, goto, "goto statements should not be used."), this);

        return [];
    }

    private static isBeforeInCode(line1: number, col1: number, line2: number, col2: number): boolean {
        if (line1 < line2) return true;
        else return col1 < col2;
    }

    private r15_2_noBackJumps($startNode: Joinpoint) {
        for (const gotoStmt of Query.searchFrom($startNode, GotoStmt)) {
            if (!Section15_ControlFlow.isBeforeInCode(gotoStmt.line, gotoStmt.column, gotoStmt.label.line, gotoStmt.label.column)) {
                this.logMISRAError(this.currentRule, gotoStmt, "Back jumps using goto statements are not allowed.");
            } //maybe there is a better way?
        }
    }

    private r15_3_gotoBlockEnclosed($startNode: Joinpoint) { 
        const labelMap = new Map();
    
        Query.searchFrom($startNode, LabelStmt).get().forEach(stmt => labelMap.set(stmt.decl.astId, stmt.astId));
    
        for (const gotoStmt of Query.searchFrom($startNode, GotoStmt)) {
            let curr = gotoStmt.getAncestor("scope");
            const ancestor = gotoStmt.getAncestor("function");
            let error = true;
            let temp;
    
            do {
                temp = curr;
                if (curr.children.map(n => n.astId).includes(labelMap.get(gotoStmt.label.astId))) {
                    error = false;
                    break;
                }
                curr = curr.getAncestor("scope");
            } while (temp.parent.astId !== ancestor.astId);
    
            if (error) {
                this.logMISRAError(this.currentRule, gotoStmt, `Label ${gotoStmt.label.name} is not declared in a block enclosing the goto statement.`);
            }
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
    
    private static addGotosToExits($startNode: Joinpoint, exits: Map<string, number>, nodes: Map<string, Joinpoint>, labels: Map<string, Joinpoint>) {
        for (const goto of Query.searchFrom($startNode, GotoStmt)) {
            let ancestor = goto.getAncestor("loop");
            const labelAncestor = labels.get(goto.label.astId)?.getAncestor("loop");
    
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
    }

    private r15_4_loopSingleBreak($startNode: Joinpoint) {
        const labelMap = new Map();
    
        Query.searchFrom($startNode, LabelStmt).get().forEach(stmt => labelMap.set(stmt.decl.astId, stmt));
    
        const exits = new Map<string, number>();
        const nodes = new Map<string, Joinpoint>();
        Section15_ControlFlow.addBreaksToExits($startNode, exits, nodes);
        Section15_ControlFlow.addGotosToExits($startNode, exits, nodes, labelMap);
    
        exits.forEach((v, k, m) => {
            if (v > 1) {
                this.logMISRAError(this.currentRule, nodes.get(k) as Joinpoint, "Loops should have at most one break/goto statement.")
            }
        }, this);
    }
}