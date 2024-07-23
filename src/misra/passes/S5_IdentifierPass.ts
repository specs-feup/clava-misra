import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass";
import { PreprocessingReqs } from "../MISRAReporter";
import { FileJp, FunctionJp, Joinpoint, StorageClass, Vardecl } from "clava-js/api/Joinpoints";
import Fix from "clava-js/api/clava/analysis/Fix";

export default class S5_IdentifierPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [PreprocessingReqs.EXTERNAL_LINKAGE_DECLS];
    
    initRuleMapper(): void {
        throw new Error("Method not implemented.");
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        throw new Error("Method not implemented.");
    }

    private static hasExternalLinkage($class: StorageClass) {
        return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
    }

    private r5_1_externalIdentifierLength($startNode: Joinpoint) {
        if (!(($startNode instanceof FunctionJp || $startNode instanceof Vardecl) && $startNode.parent instanceof FileJp)) return;
        if (!S5_IdentifierPass.hasExternalLinkage($startNode.storageClass)) return;

        if (!this._preprocessing?.externalLinkageDecls) {
            throw new Error("Preprocessing has not been initialized properly.");
        }

        if (this._preprocessing.externalLinkageDecls.filter(jp => jp.astId !== $startNode.astId).map(jp => jp.name.substring(0, 31)).includes($startNode.name.substring(0, 31))) {
            this.logMISRAError(`Identifier ${$startNode.name} is not distinct from other external identifiers.`, new Fix($startNode, $jp => {
                ($jp as FunctionJp || Vardecl).name = "a_" + ($jp as FunctionJp || Vardecl).name;
            }));
        }
    }

    protected _name: string = "Identifiers";
}