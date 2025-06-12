import { Joinpoint, Vardecl, StorageClass, FunctionJp, TypedefDecl, LabelStmt, NamedDecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { isTagDecl } from "./JoinpointUtils.js";
import { getExternalVarRefs } from "./VarUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export function isIdentifierDecl($jp: Joinpoint): boolean {
    return  ($jp instanceof Vardecl && $jp.storageClass !== StorageClass.EXTERN) || 
            ($jp instanceof FunctionJp && $jp.isImplementation) || 
            $jp instanceof TypedefDecl ||
            $jp instanceof LabelStmt ||
            isTagDecl($jp);
}

/**
 * Checks if a storage class has external linkage
 * @param $class - The storage class to check
 * @returns Returns true if the class has external linkage, otherwise returns false
 */
export function hasExternalLinkage($jp: FunctionJp | Vardecl): boolean {
    let result = $jp.storageClass !== StorageClass.STATIC && $jp.storageClass !== StorageClass.EXTERN && $jp.getAncestor("function") === undefined;
    if ($jp instanceof FunctionJp) {
        result = result && $jp.isImplementation;
    }
    return result;
}

export function hasInternalLinkage($jp: FunctionJp | Vardecl): boolean {
    let result = $jp.storageClass === StorageClass.STATIC && $jp.getAncestor("function") === undefined;
    if ($jp instanceof FunctionJp) {
        result = result && $jp.isImplementation;
    }
    return result;
}

export function isExternalLinkageIdentifier ($jp: Joinpoint):  $jp is FunctionJp | Vardecl {
    return ($jp instanceof FunctionJp || $jp instanceof Vardecl) && hasExternalLinkage($jp);
}

export function isIdentifierDuplicated($jp: Joinpoint, $others: Joinpoint[]) {
    const jpName = getIdentifierName($jp);
    return $others.some((identifier) => identifier.astId !== $jp.astId && getIdentifierName(identifier) === jpName);
}

/**
 * @returns Returns true if the identifiers are distinct within the first 31 characters. Otherwise returns false.
 */
export function areDistinctIdentifiers($jp1: Vardecl | FunctionJp, $jp2: Vardecl | FunctionJp): boolean {
    try {
        return $jp1.name.substring(0, 31) !== $jp2.name.substring(0, 31);
    } catch (error) {
        return false;
    }
}

export function getIdentifierName($jp: Joinpoint): string | undefined {
    if ($jp instanceof NamedDecl) {
        return $jp.name;
    } else if ($jp instanceof LabelStmt) {
        return $jp.decl.name;
    } 
    return undefined;
}

export function renameIdentifier($jp: Joinpoint, newName: string): boolean {
    let changedName = true;
    if ($jp instanceof FunctionJp) {
        changedName = false;
    } 
    else if ($jp instanceof LabelStmt) {
        $jp.decl.setName(newName);
    } 
    else if ($jp instanceof Vardecl) {
        if (!hasExternalLinkage($jp)) {
            $jp.setName(newName);
        } else {
            const externalRefs = getExternalVarRefs($jp);
            
            $jp.setName(newName);
            for (const varRef of externalRefs) {
                varRef.setName(newName);
            }
        }
    } 
    else if ($jp instanceof NamedDecl) {
        $jp.setName(newName);
    } else {
        changedName = false;
    }
    return changedName;
}

export function findReferencingFunctions($jp: Vardecl): FunctionJp[] {
    const fileJp = $jp.getAncestor("file");
    const functionsJp = Query.searchFrom(fileJp, FunctionJp).get();
    
    return functionsJp
        .filter(funcJp => 
            Query.searchFrom(funcJp, Varref, {decl: (declJp) => declJp?.astId === $jp.astId}).get().length > 0
        );
}