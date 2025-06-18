import { Joinpoint, Vardecl, StorageClass, FunctionJp, TypedefDecl, LabelStmt, NamedDecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { getFileLocation, isTagDecl } from "./JoinpointUtils.js";
import { findDuplicateVarDefinition, findExternalVarRefs } from "./VarUtils.js";

export function isIdentifierDecl($jp: Joinpoint): boolean {
    return  ($jp instanceof Vardecl && $jp.storageClass !== StorageClass.EXTERN) || 
            ($jp instanceof FunctionJp && $jp.isImplementation) || 
            $jp instanceof TypedefDecl ||
            $jp instanceof LabelStmt ||
            isTagDecl($jp);
}

export function getIdentifierName($jp: Joinpoint): string | undefined {
    if ($jp instanceof NamedDecl) {
        return $jp.name;
    } else if ($jp instanceof LabelStmt) {
        return $jp.decl.name;
    } 
    return undefined;
}

export function areIdentifierNamesEqual(identifier1: Joinpoint, identifier2: Joinpoint) {
    const name1 = getIdentifierName(identifier1);
    const name2 = getIdentifierName(identifier2);

    if (!name1 || !name2) return false; 
    return identifier1.ast !== identifier2.ast && name1 === name2;
}

export function renameIdentifier($jp: Joinpoint, newName: string): boolean {
    if ($jp instanceof LabelStmt) {
        $jp.decl.setName(newName);
    } 
    else if ($jp instanceof Vardecl) {
        if (!isExternalLinkageIdentifier($jp)) {
            $jp.setName(newName);
        } else {
            const externalRefs = findExternalVarRefs($jp);
            const duplicateDefs = findDuplicateVarDefinition($jp);
            
            $jp.setName(newName);
            externalRefs.forEach((varRef) => varRef.setName(newName));
            duplicateDefs.forEach((defJp) => defJp.setName(newName));            
        }
    } 
    else if ($jp instanceof NamedDecl) {
        $jp.setName(newName);
    } 
    return true;
}

export function isExternalLinkageIdentifier($jp: Joinpoint): boolean {
    if (!($jp instanceof FunctionJp || $jp instanceof Vardecl)) {
        return false;
    }
    let result = $jp.storageClass !== StorageClass.STATIC && $jp.storageClass !== StorageClass.EXTERN && $jp.getAncestor("function") === undefined;
    if ($jp instanceof FunctionJp) {
        result = result && $jp.isImplementation;
    }
    return result;
}

export function isInternalLinkageIdentifier($jp: Joinpoint): boolean {
    if (!($jp instanceof FunctionJp || $jp instanceof Vardecl)) {
        return false;
    }

    let result = $jp.storageClass === StorageClass.STATIC && $jp.getAncestor("function") === undefined;
    if ($jp instanceof FunctionJp) {
        result = result && $jp.isImplementation;
    }
    return result;
}

export function isIdentifierDuplicated($jp: Joinpoint, $others: Joinpoint[]) {
    return $others.some((identifier) => !isSameVarDecl($jp, identifier) && areIdentifierNamesEqual($jp, identifier));
}

export function isIdentifierNameDeclaredBefore($jp: Joinpoint, $others: Joinpoint[]) {
    return $others.some((identifier) => !isSameVarDecl($jp, identifier) && getFileLocation(identifier).localeCompare(getFileLocation($jp)) < 0 && areIdentifierNamesEqual(identifier, $jp));
}

/**
 * @returns Returns true if the identifiers represent different AST nodes but are not distinct within the first 31 characters. Otherwise returns false.
 */
export function areDistinctIdentifiers($jp1: Vardecl | FunctionJp, $jp2: Vardecl | FunctionJp): boolean {
    try {
        return !isSameVarDecl($jp1, $jp2) && $jp1.ast !== $jp2.ast && $jp1.name.substring(0, 31) !== $jp2.name.substring(0, 31);
    } catch (error) {
        return false;
    }
}

export function isSameVarDecl($jp1: Joinpoint, $jp2: Joinpoint): boolean {
    return $jp1 instanceof Vardecl && $jp2 instanceof Vardecl &&
            isExternalLinkageIdentifier($jp1) && isExternalLinkageIdentifier($jp2) &&
            getIdentifierName($jp1) === getIdentifierName($jp2) &&
		    $jp1.type.code === $jp2.type.code
}
