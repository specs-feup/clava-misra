import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js"
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BuiltinType, Field, IntLiteral, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";

export default class S6_TypePass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [2, this.r6_2_noSingleBitSignedFields.bind(this)],
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Field;
    }

    private r6_2_noSingleBitSignedFields($startNode: Joinpoint) {
        if (!($startNode instanceof Field)) return;

        if ($startNode.children.length > 0 && $startNode.name) {
            const width = new Number(($startNode.children[0].children[0] as IntLiteral).value);
            if (width == 1 && ($startNode.type as BuiltinType).isSigned) {
                this.logMISRAError(`Single-bit named bit field ${$startNode.name} must not have a signed type.`);
            }
        }
    }

    protected _name: string = "Types";

}