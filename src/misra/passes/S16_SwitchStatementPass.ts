import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass";
import { PreprocessingReqs } from "../MISRAReporter";
import { Break, Case, Expression, Joinpoint, Switch } from "clava-js/api/Joinpoints";
import Fix from "clava-js/api/clava/analysis/Fix";

export default class S16_SwitchStatementPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];
    private _wellFormedSwitch: boolean = false;

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r16_1_16_3_wellFormedSwitch.bind(this)],
            [2, this.r16_2_topLevelSwitchLabels.bind(this)],
            [4, this.r16_4_switchHasDefault.bind(this)],
            [5, this.r16_5_defaultFirstOrLast.bind(this)],
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
            if ($startNode.cases[i].isDefault && (i == 0 || i == $startNode.cases.length)) {
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
        let foundStmt = false;
        for (const child of $startNode.children[1].children) {
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
            this.logMISRAError("Switch statements should have more than two clauses.", new Fix(
                $startNode,
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
    }

    private r16_7_noEssentialBooleanInSwitch($startNode: Joinpoint) { //is this the best way?
        if (!($startNode instanceof Switch)) return;
        this.dependsOn(1, $startNode);
        if (this._wellFormedSwitch === false) return;
    }

    protected _name: string = "Switch statements";

}