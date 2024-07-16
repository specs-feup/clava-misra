import { Program, FileJp, Joinpoint, StorageClass, Vardecl, FunctionJp, TypedefDecl, NamedDecl, TypedefNameDecl, Class } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "lara-js/api/weaver/Query.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

export default class Section5_Identifiers extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r5_1_externalIdentifierLength.bind(this)],
            [6, this.r5_6_uniqueTypedefs.bind(this)],
            [8, this.r5_8_uniqueExternalIds.bind(this)]
        ]);
    }

    private static hasExternalLinkage($class: StorageClass) {
        return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
    }

    private r5_1_externalIdentifierLength($startNode: Joinpoint) {
        const prefixes: Set<string> = new Set();
        for (const vardecl of  Query.searchFrom($startNode, Vardecl, {storageClass: (sC: StorageClass) => Section5_Identifiers.hasExternalLinkage(sC)})) {
            if (vardecl.name.length >= 31) {
                if (prefixes.has(vardecl.name.substring(0, 32))) {
                    this.logMISRAError(vardecl, `External identifier ${vardecl.name} is not distinct.`, new Fix(vardecl, ($jp) => {
                        ($jp as Vardecl).name = "a_" + ($jp as Vardecl).name;
                    }));
                }
                else {
                    prefixes.add(vardecl.name.substring(0, 32));
                }
            }
        }

        for (const fun of Query.searchFrom($startNode, FunctionJp, {storageClass: (sC: StorageClass) => Section5_Identifiers.hasExternalLinkage(sC)})) {
            if (fun.name.length >= 31) {
                if (prefixes.has(fun.name.substring(0, 32))) {
                    this.logMISRAError(fun, `External identifier ${fun.name} is not distinct.`, new Fix(fun, ($jp) => {
                        ($jp as FunctionJp).name = "a_" + ($jp as FunctionJp).name;
                    }));
                }
                else {
                    prefixes.add(fun.name.substring(0, 32));
                }
            }
        }
    }

    private r5_6_uniqueTypedefs($startNode: Joinpoint) { //exception is missing
        const typedefs: Set<string> = new Set();

        for (const typedef of Query.searchFrom($startNode, TypedefDecl)) {
            if (typedefs.has(typedef.name)) {
                this.logMISRAError(typedef, "Typedef names must be unique across all translation units.");
            }
            else {
                typedefs.add(typedef.name);
            }
        }

        Query.searchFrom($startNode, NamedDecl).get().filter(decl => !(decl instanceof TypedefNameDecl)).forEach(decl => {
            if (decl instanceof Class) {
                const typedefChildren = decl.getDescendants("typedefDecl") as TypedefDecl[];
                for (const child of typedefChildren) {
                    if (decl.name === child.name) return;
                }
            }
            if (typedefs.has(decl.name)) {
                this.logMISRAError(decl, `${decl.name} is also the name of a typedef. Typedef identifiers must not be reused.`);
            }
        }, this);
    }

    private r5_8_uniqueExternalIds($startNode: Joinpoint) {
        const ids: Set<string> = new Set();
        for (const vardecl of  Query.searchFrom($startNode, Vardecl, {storageClass: (sC: StorageClass) => Section5_Identifiers.hasExternalLinkage(sC)})) {
                if (ids.has(vardecl.name)) {
                    this.logMISRAError(vardecl, `External identifier ${vardecl.name} must be unique across all translation units.`, new Fix(vardecl, ($jp) => {
                        ($jp as Vardecl).name = "a_" + ($jp as Vardecl).name;
                    }));
                }
                else {
                    ids.add(vardecl.name);
                }
        }

        for (const fun of Query.searchFrom($startNode, FunctionJp, {storageClass: (sC: StorageClass) => Section5_Identifiers.hasExternalLinkage(sC)})) {
            if (ids.has(fun.name)) {
                this.logMISRAError(fun, `External identifier ${fun.name} must be unique across all translation units.`, new Fix(fun, ($jp) => {
                    ($jp as FunctionJp).name = "a_" + ($jp as FunctionJp).name;
                }));
            }
            else {
                ids.add(fun.name);
            }
        }
    }
}