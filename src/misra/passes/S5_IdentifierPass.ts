import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass";
import { PreprocessingReqs } from "../MISRAReporter";

export default class S5_IdentifierPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [PreprocessingReqs.EXTERNAL_LINKAGE_DECLS];

    initRuleMapper(): void {
        throw new Error("Method not implemented.");
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        throw new Error("Method not implemented.");
    }

    protected _name: string = "Identifiers";
}