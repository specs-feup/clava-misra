import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { Class, FileJp, FunctionJp, Joinpoint, NamedDecl, StorageClass, TypedefDecl, TypedefNameDecl, Vardecl } from "clava-js/api/Joinpoints.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

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

    private r5_6_uniqueTypedefs($startNode: Joinpoint) {
        if (!this._preprocessing?.typedefDecls) {
            throw new Error("Preprocessing has not been initialized properly.");
        }
        if ($startNode instanceof NamedDecl && !($startNode instanceof TypedefNameDecl)) {
            if ($startNode instanceof Class) {
                const typedefChildren = $startNode.getDescendants("typedefDecl") as TypedefDecl[];
                for (const child of typedefChildren) {
                    if ($startNode.name === child.name) return;
                }
            }
            if (this._preprocessing.typedefDecls.some(jp => jp.name === $startNode.name)) {
                this.logMISRAError(`${$startNode.name} is also the name of a typedef. Typedef identifiers must not be reused.`, new Fix($startNode, jp => {
                    const declJp = jp as NamedDecl;
                    declJp.name = declJp.name + "_" + declJp.astId;
                }));
            }
        }
        else if ($startNode instanceof TypedefNameDecl) {
            if (this._preprocessing.typedefDecls.filter(jp => jp.astId !== $startNode.astId).some(jp => jp.name === $startNode.name)) {
                this.logMISRAError("Typedef names must be unique across all translation units.", new Fix($startNode, jp => {
                    const typedefJp = jp as TypedefDecl;
                    typedefJp.name = typedefJp.name + "_" + typedefJp.astId;
                }));
            }
        }
    }

    protected _name: string = "Identifiers";
}