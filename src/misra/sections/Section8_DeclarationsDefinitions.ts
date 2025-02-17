import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Param, FunctionJp, StorageClass, Vardecl, EnumDecl, IntLiteral, Joinpoint, DeclStmt, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";

export default class Section8_DeclarationsDefinitions extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;
    
    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["8.2", this.r8_2_functionPrototype.bind(this)],
            ["8.3", this.r8_3_compatibleDefinitions.bind(this)],
            ["8.7", this.r8_7_noUnnecessaryExternalLinkage.bind(this)],
            ["8.10", this.r8_10_onlyStaticInline.bind(this)],
            ["8.11", this.r8_11_externArrayExplicitSize.bind(this)],
            ["8.12", this.r8_12_implicitExplicitEnumMatching.bind(this)]
        ]);
    }

    private r8_2_functionPrototype($startNode: Joinpoint) { //needs to apply to function pointers, void info lost
        Query.searchFrom($startNode, Param).get().filter(param => !param.name)
            .forEach(param => this.logMISRAError(this.currentRule, param, `Parameter of type ${param.type.code} lacks a name.`), this);
    }

    private r8_3_compatibleDefinitions($startNode: Joinpoint) { //what if no impl?
        Query.searchFrom($startNode, FunctionJp, {isImplementation: true}).get().forEach(fun => {
            fun.declarationJps.forEach(decl => {
                for (let i = 0; i < fun.params.length; i++) {
                    if (fun.paramNames[i] !== decl.paramNames[i]) {
                        this.logMISRAError(this.currentRule, fun, `Mismatch in name of parameters with declaration on ${decl.filename}@${decl.line}:${decl.column}.`);
                    }
                    if (fun.params[i].type.code !== decl.params[i].type.code) {
                        this.logMISRAError(this.currentRule, fun, `Mismatch in parameter types with declaration on ${decl.filename}@${decl.line}:${decl.column}`);
                    }
                }
            }, this);
        }, this);
    }

    private static hasExternalLinkage(jp: FunctionJp | Vardecl) {
        return jp.storageClass !== StorageClass.STATIC && jp.storageClass !== StorageClass.EXTERN;
    }

    private r8_7_noUnnecessaryExternalLinkage($startNode: Joinpoint) { //finish
        const globals = new Map();
    
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
                        this.logMISRAError(this.currentRule, jp, `Function ${jp.name} has external linkage but it is only referenced in its file.`);
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
            this.logMISRAError(this.currentRule, v.decl, `Variable ${v.decl.name} is declared with external linkage but is not referenced outside its file.`);
        }, this);
    }

    private r8_10_onlyStaticInline($startNode: Joinpoint) {
        Query.searchFrom($startNode, FunctionJp, {isInline: true}).get().forEach(fun => {
            if (fun.storageClass !== StorageClass.STATIC) {
                this.logMISRAError(this.currentRule, fun, "Inline functions must always be declared static.");
            }
        });
    }

    private r8_11_externArrayExplicitSize($startNode: Joinpoint) {
        for (const varDecl of Query.searchFrom($startNode, Vardecl, {storageClass: StorageClass.EXTERN})) {
            if (varDecl.type.isArray && varDecl.type.arraySize === -1) {
                this.logMISRAError(this.currentRule, varDecl, `Size of external array ${varDecl.name} is not explicit.`)
            }
        }
    }

    private setEnumMap(map: Map<number, boolean>, newValue: number, isExplicit: boolean, jp: EnumDecl) {
        if (map.has(newValue) && !(isExplicit && map.get(newValue))) {
            this.logMISRAError(this.currentRule, jp, `An implicitly numbered identifier in enum ${jp.name} shares a value with another identifier.`, new Fix(jp, jp => {
                
            }));
        }
        map.set(newValue, isExplicit);
    }
    
    private r8_12_implicitExplicitEnumMatching($startNode: Joinpoint) {
        for (const enumDecl of Query.searchFrom($startNode, EnumDecl)) {
            const map = new Map();
    
            let index = 0;
            for (const enumerator of enumDecl.enumerators) {
                if (enumerator.children.length > 0) {
                    if (enumerator.children[0].children[0] instanceof IntLiteral) {
                        index = Number(enumerator.children[0].children[0].value);
                        this.setEnumMap(map, index, true, enumDecl);
                    }
                    else {
                        console.log(`Warning! Could not analyse the entirety of enum ${enumDecl.name} due to non-constant expressions`);
                        return;
                    }
                }
                else {
                    this.setEnumMap(map, index, false, enumDecl);
                }
                index++;
            }
        }
    }
}