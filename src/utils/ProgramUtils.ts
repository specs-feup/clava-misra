import { Vardecl, FunctionJp, Program, LabelStmt, NamedDecl, StorageClass } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isExternalLinkageIdentifier, isIdentifierDecl, isInternalLinkageIdentifier } from "./IdentifierUtils.js";


let cachedInternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;
let cachedExternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;
let cachedExternalLinkageVars: (Vardecl)[] | null = null;
let cachedExternalVarRefs: (Vardecl)[] | null = null;
let cachedIdentifierDecls: any[] | null = null;

export function resetCaches() {
    cachedInternalLinkageIdentifiers = null;
    cachedExternalLinkageIdentifiers = null;
    cachedExternalLinkageVars = null;
    cachedExternalVarRefs = null;
    cachedIdentifierDecls = null;
}

export function resetExternalVarRefs() {
    cachedExternalVarRefs = null;
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

    const externalLinkageVarDecls = getExternalLinkageVars();
    const externalLinkageFunctions = Query.search(FunctionJp, (varDeclJp) => isExternalLinkageIdentifier(varDeclJp)).get();

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

    const internalLinkageVarsDecls = Query.search(Vardecl, (decl) => isInternalLinkageIdentifier(decl)).get();
    const internalLinkageFunctions =  Query.search(FunctionJp, (decl) => isInternalLinkageIdentifier(decl)).get();
    cachedInternalLinkageIdentifiers = [
        ...internalLinkageFunctions, 
        ...internalLinkageVarsDecls
    ];
    return cachedInternalLinkageIdentifiers;
}

export function getExternalLinkageVars(): Vardecl[] {
    if (cachedExternalLinkageVars != null) {
        return cachedExternalLinkageVars;
    }
    cachedExternalLinkageVars = Query.search(Vardecl, (varDeclJp) => isExternalLinkageIdentifier(varDeclJp)).get();
    return cachedExternalLinkageVars;
}

export function getExternalVarRefs(): Vardecl[] {
    if (cachedExternalVarRefs !== null) {
        return cachedExternalVarRefs;
    }
    cachedExternalVarRefs = Query.search(Vardecl, {storageClass: StorageClass.EXTERN}).get();
    return cachedExternalVarRefs;
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