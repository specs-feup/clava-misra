import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { Class, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";

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

    protected _name: string = "Overlapping storage";
    
}