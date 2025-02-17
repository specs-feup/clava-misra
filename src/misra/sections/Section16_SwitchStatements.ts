import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Switch, Break, Case, Joinpoint, BuiltinType, BoolLiteral, Expression } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export default class Section16_SwitchStatements extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["16.1", this.r16_1_16_3_wellFormedSwitch.bind(this)],
            ["16.2", this.r16_2_topLevelSwitchLabels.bind(this)],
            ["16.3", this.r16_1_16_3_wellFormedSwitch.bind(this)],
            ["16.4", this.r16_4_switchHasDefault.bind(this)],
            ["16.5", this.r16_5_defaultFirstOrLast.bind(this)],
            ["16.6", this.r16_6_noTwoClauses.bind(this)],
            ["16.7", this.r16_7_noEssentialBooleanInSwitch.bind(this)]
        ]);
    }

    private r16_1_16_3_wellFormedSwitch($startNode: Joinpoint) {
        for (const switchStmt of Query.searchFrom($startNode, Switch)) {
    
            let foundStmt = false;
            let first = true;
            for (const child of switchStmt.children[1].children) {
                if (child instanceof Break) {;
                    foundStmt = false;
                }
                else if (child instanceof Case) {
                    first = false;
                }
                else {
                    foundStmt = true;
                }
    
                if (foundStmt && child.instanceOf("case")) {
                    this.logMISRAError(this.currentRule, child, `A break is missing before ${child.code}`);
                }
            }
            if (!switchStmt.children[1].lastChild.instanceOf("break")) {
                this.logMISRAError(this.currentRule, switchStmt.children[1].lastChild, "A break is missing at the end of the switch statement.");
            }
        }   
    }

    private r16_2_topLevelSwitchLabels($startNode: Joinpoint) {
        Query.searchFrom($startNode, Case).get().forEach(caseLabel => {
            if (!caseLabel.currentRegion.instanceOf("switch")) {
                this.logMISRAError(this.currentRule, caseLabel, "A switch label can only be used if its enclosing compound statement is the switch statement itself.")
            }
        }, this);
    }

    private r16_4_switchHasDefault($startNode: Joinpoint) {
        Query.searchFrom($startNode, Switch, {hasDefaultCase: false}).get().forEach(sw => this.logMISRAError(this.currentRule, sw, "Switch statement is missing a default case."), this);
    }

    private r16_5_defaultFirstOrLast($startNode: Joinpoint) {
        Query.searchFrom($startNode, Switch).get().forEach(switchStmt => {
            for (let i = 0; i < switchStmt.cases.length; i++) {
                if (switchStmt.cases[i].isDefault && (i == 0 || i == switchStmt.cases.length)) {
                    return;
                }
                else if (switchStmt.cases[i].isDefault) {
                    this.logMISRAError(this.currentRule, switchStmt, "The default case of a switch statement must be the first or last label.");
                    return;
                }
            }
        }, this);
    }

    private r16_6_noTwoClauses($startNode: Joinpoint) {
        Query.searchFrom($startNode, Switch).get().forEach(switchStmt => {
            let clauses = 0;
            let foundStmt = false;
            for (const child of switchStmt.children[1].children) {
                if (child instanceof Case && foundStmt) {
                    clauses++;
                    foundStmt = false;
                }
                else if (child instanceof Break) {
                    clauses++;
                    foundStmt = false;
                }
                else {
                    foundStmt = true;
                }
            }

            if (clauses == 2) {
                this.logMISRAError(this.currentRule, switchStmt, "Switch statements should have more than two clauses.", new Fix(
                    switchStmt,
                    (switchStmt: Joinpoint) => {
                        let firstClauseExpr: Expression;
                        let secondClauseExpr: Expression;
                        let firstClause: Joinpoint[] = [];
                        let secondClause: Joinpoint[] = []
                        for (const child of switchStmt.children[1].children) {
                             
                        }
                    }
                ));
            }
        }, this);
    }

    private r16_7_noEssentialBooleanInSwitch($startNode: Joinpoint) { //is this the best way?
        Query.searchFrom($startNode, Switch).get().forEach(switchStmt => {
            if (switchStmt.condition.type instanceof BuiltinType && switchStmt.condition.type.builtinKind === "Bool") {
                this.logMISRAError(this.currentRule, switchStmt, `Switch statement controlling expression ${switchStmt.condition.code} must not have essentially boolean type.`, new Fix(
                    switchStmt,
                    (switchStmt) => {
                        const trueClause: Joinpoint[] = [];
                        const falseClause: Joinpoint[] = [];
                        let inTrue: boolean = false;
                        let inFalse: boolean = false;
                        for (const child of switchStmt.children[1].children) {
                            if (child instanceof Case && child.values.length == 1 && child.values[0].children[0] instanceof BoolLiteral && child.values[0].children[0].value) {
                                inTrue = true;
                                inFalse = false;
                            }
                            else if (child instanceof Case && child.values.length == 1 && child.values[0].children[0] instanceof BoolLiteral && !child.values[0].children[0].value) {
                                inFalse = true;
                                inTrue = false;
                            }
                            else if (child instanceof Break) {
                                inTrue = false;
                                inFalse = false;
                            }

                            if (inTrue && !(child instanceof Case)) {
                                trueClause.push(child.deepCopy());
                            }
                            else if (inFalse && !(child instanceof Case)) {
                                falseClause.push(child.deepCopy());
                            }
                        }

                        const ifStmt = ClavaJoinPoints.ifStmt(
                            (switchStmt as Switch).condition,
                            ClavaJoinPoints.scope(...trueClause),
                            ClavaJoinPoints.scope(...falseClause)
                        );

                        switchStmt.replaceWith(ifStmt);
                    }
                ));
            }
        }, this);
    }
    
}