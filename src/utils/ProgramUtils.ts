import { Vardecl, FunctionJp, StorageClass } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { hasExternalLinkage } from "./IdentifierUtils.js";

/**
 * Retrieves all variables and functions that are eligible for `extern` linkage, i.e., 
 * elements with storage classes that are not `STATIC` or `EXTERN`
 * @returns Array of functions and variables that can be declared as external
 */
export function getExternalLinkageIdentifiers(): (FunctionJp | Vardecl)[] {
    return [
        ...getExternalLinkageFunctions(), 
        ...getExternalLinkageVarDecls()
    ];
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
        try {
            return decl.storageClass === StorageClass.STATIC && decl.getAncestor("function") === undefined
        } catch(error) {
            return false;
        }
    }).get();
}

export function getInternalLinkageFunctions(): FunctionJp[] {
    return Query.search(FunctionJp, (decl) => {
        try {
            return decl.storageClass === StorageClass.STATIC && decl.getAncestor("function") === undefined
        } catch(error) {
            return false;
        }
    }).get();
}

export function getInternalLinkageIdentifiers(): (FunctionJp | Vardecl)[] {
    return [
        ...getInternalLinkageFunctions(), 
        ...getInternalLinkageVarsDecls()
    ];
}