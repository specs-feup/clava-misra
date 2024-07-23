import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass";
import { PreprocessingReqs } from "../MISRAReporter";
import { Class, Joinpoint } from "clava-js/api/Joinpoints";

export default class S19_OverlappingStoragePass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [2, this.r19_2_noUnion.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Class;
    }

    private r19_2_noUnion($startNode: Joinpoint) {
        if (!($startNode instanceof Class && $startNode.kind === "union")) return;

        this.logMISRAError("The union keyword should not be used.");
    }

    protected _name: string;
    
}