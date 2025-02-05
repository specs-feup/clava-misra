import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BinaryOp, Break, BuiltinType, Case, Expression, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export default class S16_SwitchStatementPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];
    private _wellFormedSwitch: boolean = false;

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r16_1_16_3_wellFormedSwitch.bind(this)],
            [2, this.r16_2_topLevelSwitchLabels.bind(this)],
            [4, this.r16_4_switchHasDefault.bind(this)],
            [5, this.r16_5_defaultFirstOrLast.bind(this)],
            [6, this.r16_6_noTwoClauses.bind(this)],
            [7, this.r16_7_noEssentialBooleanInSwitch.bind(this)]
        ]);
    }
    
    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Switch || $jp instanceof Case;
    }

    private r16_1_16_3_wellFormedSwitch($startNode: Joinpoint) {
        if (!($startNode instanceof Switch)) return;
        this._wellFormedSwitch = true;

        let foundStmt = false;
        let first = true;
        for (const child of $startNode.children[1].children) {
            if (child instanceof Break) {;
                foundStmt = false;
            }
            else if (child instanceof Case) {
                first = false;
            }
            else {
                foundStmt = true;
            }

            if (foundStmt && child instanceof Case) {
                this.logMISRAError(`A break is missing before ${child.code}`);
                this._wellFormedSwitch = false;
            }
        }
        if (!($startNode.children[1].lastChild instanceof Break)) {
            this.logMISRAError("A break is missing at the end of the switch statement.");
            this._wellFormedSwitch = false;
        }  
    }

    private r16_2_topLevelSwitchLabels($startNode: Joinpoint) {
        if (!($startNode instanceof Case)) return;

        if (!($startNode.currentRegion instanceof Switch)) {
            this.logMISRAError("A switch label can only be used if its enclosing compound statement is the switch statement itself.");
        }
    }

    private r16_4_switchHasDefault($startNode: Joinpoint) {
        if (!($startNode instanceof Switch && !$startNode.hasDefaultCase)) return;

        this.logMISRAError("Switch statement is missing a default case.");
    }
    

    private r16_5_defaultFirstOrLast($startNode: Joinpoint) {
        if (!($startNode instanceof Switch)) return;

        for (let i = 0; i < $startNode.cases.length; i++) {
            if ($startNode.cases[i].isDefault && (i == 0 || i == $startNode.cases.length-1)) {
                return;
            }
            else if ($startNode.cases[i].isDefault) {
                this.logMISRAError("The default case of a switch statement must be the first or last label.");
                return;
            }
        }
    }

    private r16_6_noTwoClauses($startNode: Joinpoint) {
        if (!($startNode instanceof Switch)) return;
        this.dependsOn(1, $startNode);
        if (this._wellFormedSwitch === false) return; 

        let clauses = 0;
        for (const child of $startNode.children[1].children) {
            if (child instanceof Break) {
                clauses++;
            }
        }

        if (clauses <= 2) {
            this.logMISRAError("Switch statements should have more than two clauses.", new Fix(
                $startNode,
                (switchStmt: Joinpoint) => {
                    const switchJp = switchStmt as Switch;
                    let firstClauseExpr: Expression | undefined = undefined;
                    let secondClauseExpr: Expression | undefined = undefined;
                    let firstClause: Joinpoint[] = [];
                    let secondClause: Joinpoint[] = [];
                    let currClauseExpr: Expression | undefined = undefined;
                    let currClause: Joinpoint[] = [];
                    let clauseHasDefault: boolean = false;
                    let filledFirstClause: boolean = false;
                    const newVar = ClavaJoinPoints.varDecl("switchToIf_" + switchJp.astId, switchJp.condition);
                    switchJp.insertBefore(newVar.stmt);
                    for (const child of switchStmt.children[1].children) {
                            if (child instanceof Case) {
                                let tempOp: BinaryOp;
                                if (child.isDefault) {
                                    clauseHasDefault = true;
                                    continue;
                                }
                                else if (child.values.length === 1) {
                                    tempOp = ClavaJoinPoints.binaryOp("eq", newVar.varref(), child.values[0]);
                                }
                                else {
                                    tempOp = ClavaJoinPoints.binaryOp("l_or", ClavaJoinPoints.binaryOp("ge", newVar.varref(), child.values[0]), ClavaJoinPoints.binaryOp("le", newVar.varref(), child.values[1]));
                                }
                                currClauseExpr = currClauseExpr ? ClavaJoinPoints.binaryOp("l_or", currClauseExpr, tempOp) : tempOp;
                            }
                            else if (child instanceof Break) {
                                if (clauseHasDefault) {
                                    secondClause = currClause;
                                    secondClauseExpr = undefined;
                                }
                                else if (filledFirstClause) {
                                    secondClause = currClause;
                                    secondClauseExpr = currClauseExpr;
                                }
                                else {
                                    firstClause = currClause;
                                    firstClauseExpr = currClauseExpr;
                                    filledFirstClause = true;
                                }
                                clauseHasDefault = false;
                                currClause = [];
                                currClauseExpr = undefined;
                            }
                            else {
                                currClause.push(child);
                            }
                    }

                    const elseStmt = secondClauseExpr ? ClavaJoinPoints.ifStmt(secondClauseExpr, ClavaJoinPoints.scope(...secondClause)) : ClavaJoinPoints.scope(...secondClause);
                    switchJp.replaceWith(ClavaJoinPoints.ifStmt(firstClauseExpr ?? "", ClavaJoinPoints.scope(...firstClause), elseStmt));
                }
            ));
        }
    }

    private r16_7_noEssentialBooleanInSwitch($startNode: Joinpoint) { //UNFINISHED, can have transformation
        if (!($startNode instanceof Switch)) return;
        this.dependsOn(1, $startNode);
        if (this._wellFormedSwitch === false) return;

        if ($startNode.condition.type.desugarAll instanceof BuiltinType && $startNode.condition.type.desugarAll.builtinKind === "Bool") {
            this.logMISRAError("The controlling expression of a switch statement must not have essentially boolean type.");
        }
    }

    protected _name: string = "Switch statements";

}