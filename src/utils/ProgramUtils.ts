import { Vardecl, FunctionJp, StorageClass, Program, Joinpoint, TypedefDecl, RecordJp, EnumDecl, LabelStmt, NamedDecl } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { hasExternalLinkage, hasInternalLinkage, isIdentifierDecl } from "./IdentifierUtils.js";
import JoinPoints from "@specs-feup/lara/api/weaver/JoinPoints.js";
import { getFileLocation } from "./JoinpointUtils.js";


let cachedInternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;
let cachedExternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;
let cachedIdentifierDecls: any[] | null = null;

export function resetCaches() {
    cachedInternalLinkageIdentifiers = null;
    cachedExternalLinkageIdentifiers = null;
    cachedIdentifierDecls = null;
}

export function rebuildProgram() {
    (Query.root() as Program).rebuild();
    resetCaches();
}

/**
 * Retrieves all variables and functions that are eligible for `extern` linkage, i.e., 
 * elements with storage classes that are not `STATIC` or `EXTERN`
 * @returns Array of functions and variables that can be declared as external
 */
export function getExternalLinkageIdentifiers(): (FunctionJp | Vardecl)[] {
    if (cachedExternalLinkageIdentifiers !== null) {
        return cachedExternalLinkageIdentifiers;
    }

    const externalLinkageVarDecls = Query.search(Vardecl, (varDeclJp) => hasExternalLinkage(varDeclJp)).get();
    const externalLinkageFunctions = Query.search(FunctionJp, (varDeclJp) => hasExternalLinkage(varDeclJp)).get();

    cachedExternalLinkageIdentifiers = [
        ...externalLinkageFunctions, 
        ...externalLinkageVarDecls
    ];
    return cachedExternalLinkageIdentifiers;
}

export function getInternalLinkageIdentifiers(): (FunctionJp | Vardecl)[] {
    if (cachedInternalLinkageIdentifiers !== null) {
        return cachedInternalLinkageIdentifiers;
    }

    const internalLinkageVarsDecls = Query.search(Vardecl, (decl) => hasInternalLinkage(decl)).get();
    const internalLinkageFunctions =  Query.search(FunctionJp, (decl) => hasInternalLinkage(decl)).get();
    cachedInternalLinkageIdentifiers = [
        ...internalLinkageFunctions, 
        ...internalLinkageVarsDecls
    ];
    return cachedInternalLinkageIdentifiers;
}

export function getIdentifierDecls(): any[] {
    if (cachedIdentifierDecls !== null) {
        return cachedIdentifierDecls;
    }
    cachedIdentifierDecls = [
        ...Query.search(NamedDecl).get(),
        ...Query.search(LabelStmt).get(),
    ].filter((jp) => isIdentifierDecl(jp));
    return cachedIdentifierDecls;
}