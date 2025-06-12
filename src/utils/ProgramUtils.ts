import { Vardecl, FunctionJp, StorageClass } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { hasExternalLinkage, hasInternalLinkage } from "./IdentifierUtils.js";


let cachedInternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;
let cachedExternalLinkageIdentifiers: (FunctionJp | Vardecl)[] | null = null;

export function resetCaches() {
    cachedInternalLinkageIdentifiers = null;
    cachedExternalLinkageIdentifiers = null;
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

    cachedExternalLinkageIdentifiers = [
        ...getExternalLinkageFunctions(), 
        ...getExternalLinkageVarDecls()
    ];
    return cachedExternalLinkageIdentifiers;
}

export function getInternalLinkageIdentifiers(): (FunctionJp | Vardecl)[] {
    if (cachedInternalLinkageIdentifiers !== null) {
        return cachedInternalLinkageIdentifiers;
    }

    cachedInternalLinkageIdentifiers = [
        ...getInternalLinkageFunctions(), 
        ...getInternalLinkageVarsDecls()
    ];
    return cachedInternalLinkageIdentifiers;
}

/**
 * Retrieves all variables that are eligible for `extern` linkage, i.e., 
 * variable declarations with storage classes that are not `STATIC` or `EXTERN`
 * 
 * @returns Array of variables that can be declared as external
 */
export function getExternalLinkageVarDecls(): Vardecl[] {
    return Query.search(Vardecl, (varDeclJp) => {
        return hasExternalLinkage(varDeclJp);
    }).get();
}

export function getExternalLinkageFunctions(): FunctionJp[] {
    return Query.search(FunctionJp, (varDeclJp) => {
        return hasExternalLinkage(varDeclJp);
    }).get();
}

export function getInternalLinkageVarsDecls(): Vardecl[] {
    return Query.search(Vardecl, (decl) => {
        return hasInternalLinkage(decl)
    }).get();
}

export function getInternalLinkageFunctions(): FunctionJp[] {
    return Query.search(FunctionJp, (decl) => {
        return hasInternalLinkage(decl)
    }).get();
}