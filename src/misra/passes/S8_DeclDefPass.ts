import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { EnumDecl, FunctionJp, IntLiteral, Joinpoint, Param, StorageClass, Vardecl } from "clava-js/api/Joinpoints.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

export default class S8_DeclDefPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];
    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [2, this.r8_2_functionPrototype.bind(this)],
            [3, this.r8_3_compatibleDefinitions.bind(this)],
            [7, this.r8_7_noUnnecessaryExternalLinkage.bind(this)],
            [10, this.r8_10_onlyStaticInline.bind(this)],
            [11, this.r8_11_externArrayExplicitSize.bind(this)],
            [12, this.r8_12_implicitExplicitEnumMatching.bind(this)]
        ]);
    }
    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Param || $jp instanceof FunctionJp || $jp instanceof Vardecl || $jp instanceof EnumDecl;
    }

    private r8_2_functionPrototype($startNode: Joinpoint) { //needs to apply to function pointers, void info lost
        if (!($startNode instanceof Param)) return;

        if (!$startNode.name) this.logMISRAError(`Parameter of type ${$startNode.type.code} lacks a name.`);
    }

    private r8_3_compatibleDefinitions($startNode: Joinpoint) { //what if no impl?
        if (!($startNode instanceof FunctionJp && $startNode.isImplementation)) return;

        $startNode.declarationJps.forEach(decl => {
            for (let i = 0; i < $startNode.params.length; i++) {
                if ($startNode.paramNames[i] !== decl.paramNames[i]) {
                    this.logMISRAError(`Mismatch in name of parameters with declaration on ${decl.filename}@${decl.line}:${decl.column}.`);
                }
                if ($startNode.params[i].type.code !== decl.params[i].type.code) {
                    this.logMISRAError(`Mismatch in parameter types with declaration on ${decl.filename}@${decl.line}:${decl.column}`);
                }
            }
        }, this);
    }

    private static hasExternalLinkage(jp: FunctionJp | Vardecl) {
        return jp.storageClass !== StorageClass.STATIC && jp.storageClass !== StorageClass.EXTERN;
    }

    private r8_7_noUnnecessaryExternalLinkage($startNode: Joinpoint) { //finish
        /*const globals = new Map();
    
        Query.searchFrom($startNode, FileJp).get().forEach(file => {
            file.children.forEach(jp => {
                if (jp instanceof FunctionJp && jp.name !== "main" && Section8_DeclarationsDefinitions.hasExternalLinkage(jp)) {
                    let hasExternals = false;
                    jp.calls.forEach(call => {
                        if (call.filename !== jp.filename) {
                            hasExternals = true;
                        }
                    }, this);
                    if (!hasExternals) {
                        this.logMISRAError(jp, `Function ${jp.name} has external linkage but it is only referenced in its file.`);
                    }
                }
    
                if (jp instanceof DeclStmt) {
                    jp.decls.filter(decl => decl instanceof Vardecl && Section8_DeclarationsDefinitions.hasExternalLinkage(decl)).forEach(decl => {
                        //globals.push({decl: decl as Vardecl, file: decl.filename});
                        globals.set(decl.astId, {decl: decl as Vardecl, file: decl.filename});
                    }, this);
                }
            });
        }, this);

        Query.searchFrom($startNode, Varref).get().forEach(ref => {
            if (globals.has(ref.astId)) {
                const declFile = globals.get(ref.astId).file;
                if (declFile !== ref.filename) {
                    globals.delete(ref.astId);
                }
            }
        }, this);

        globals.forEach((v, k, m) => {
            this.logMISRAError(v.decl, `Variable ${v.decl.name} is declared with external linkage but is not referenced outside its file.`);
        }, this);
    */}

    private r8_10_onlyStaticInline($startNode: Joinpoint) {
        if (!($startNode instanceof FunctionJp && $startNode.isInline)) return;

        if ($startNode.storageClass !== StorageClass.STATIC) {
            this.logMISRAError("Inline functions must always be declared static.");
        }
    }

    private r8_11_externArrayExplicitSize($startNode: Joinpoint) {
        if (!($startNode instanceof Vardecl && $startNode.storageClass === StorageClass.EXTERN)) return;

        if ($startNode.type.isArray && $startNode.type.arraySize === -1) {
            this.logMISRAError(`Size of external array ${$startNode.name} is not explicit.`)
        }
    }

    private setEnumMap(map: Map<number, boolean>, newValue: number, isExplicit: boolean, jp: EnumDecl) {
        if (map.has(newValue) && !(isExplicit && map.get(newValue))) {
            this.logMISRAError(`An implicitly numbered identifier in enum ${jp.name} shares a value with another identifier.`, new Fix(jp, jp => {
                
            }));
        }
        map.set(newValue, isExplicit);
    }
    
    private r8_12_implicitExplicitEnumMatching($startNode: Joinpoint) {
        if (!($startNode instanceof EnumDecl)) return;

        const map = new Map();

        let index = 0;
        for (const enumerator of $startNode.enumerators) {
            if (enumerator.children.length > 0) {
                if (enumerator.children[0].children[0] instanceof IntLiteral) {
                    index = Number(enumerator.children[0].children[0].value);
                    this.setEnumMap(map, index, true, $startNode);
                }
                else {
                    console.log(`Warning! Could not analyse the entirety of enum ${$startNode.name} due to non-constant expressions`);
                    return;
                }
            }
            else {
                this.setEnumMap(map, index, false, $startNode);
            }
            index++;
        }
    }

    protected _name: string = "Declarations and definitions";
}