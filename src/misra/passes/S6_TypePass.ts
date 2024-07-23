import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass"
import { PreprocessingReqs } from "../MISRAReporter";
import { BuiltinType, Field, IntLiteral, Joinpoint } from "clava-js/api/Joinpoints";

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

    protected _name: string;

}