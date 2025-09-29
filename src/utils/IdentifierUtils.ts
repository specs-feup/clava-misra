import { Joinpoint, Vardecl, StorageClass, FunctionJp, TypedefDecl, LabelStmt, NamedDecl } from "@specs-feup/clava/api/Joinpoints.js";
import { compareLocation, isTagDecl } from "./JoinpointUtils.js";
import { findDuplicateVarDefinition, findExternalVarRefs, isSameVarDecl } from "./VarUtils.js";

/**
 * Checks if the given joinpoint is an identifier declaration (variable, function, typedef, label, or tag)
 * 
 * @param $jp The joinpoint to evaluate
 * @returns True if the join point is an identifier declaration, false otherwise
 */
export function isIdentifierDecl($jp: Joinpoint): boolean {
    return  ($jp instanceof Vardecl && $jp.storageClass !== StorageClass.EXTERN) || 
            ($jp instanceof FunctionJp && $jp.isImplementation) || 
            $jp instanceof TypedefDecl ||
            $jp instanceof LabelStmt ||
            isTagDecl($jp);
}

/**
 * Retrieves the name of the given joinpoint
 * @param $jp The joinpoint to evaluate
 * @returns The name of the identifier, or undefined if the join point does not represent an identifier
 */
export function getIdentifierName($jp: Joinpoint): string | undefined {
    if ($jp instanceof NamedDecl) {
        return $jp.name;
    } else if ($jp instanceof LabelStmt) {
        return $jp.decl.name;
    } 
    return undefined;
}

/**
 * Checks if two joinpoints represent different identifiers with the same name
 * @param identifier1 The first joinpoint to evaluate
 * @param identifier2 The second joinpoint to evaluate
 * @returns True if names match and the nodes differ, otherwise returns false
 */
export function areIdentifierNamesEqual(identifier1: Joinpoint, identifier2: Joinpoint) {
    const name1 = getIdentifierName(identifier1);
    const name2 = getIdentifierName(identifier2);

    if (!name1 || !name2) return false; 
    return identifier1.ast !== identifier2.ast && name1 === name2;
}

/**
 * Updates the name of an identifier joinpoint
 * @param $jp The joinpoint to rename
 * @param newName the new identifier name
 * @returns True if renaming was successful, false otherwise
 */
export function renameIdentifier($jp: Joinpoint, newName: string): boolean {
    if ($jp instanceof LabelStmt) {
        $jp.decl.setName(newName);
    } 
    else if ($jp instanceof Vardecl) {
        const externalRefs = findExternalVarRefs($jp);
        const duplicateDefs = findDuplicateVarDefinition($jp);
        
        $jp.setName(newName);
        if (isExternalLinkageIdentifier($jp)) { 
            externalRefs.forEach((varRef) => varRef.setName(newName));
            duplicateDefs.forEach((defJp) => defJp.setName(newName));   
        }         
    } 
    else if ($jp instanceof NamedDecl) {
        $jp.setName(newName);
    } 
    return true;
}

/**
 * Checks if a given joinpoint represents an identifier with external linkage
 * 
 * @param $jp The joinpoint to evaluate
 * @returns  True if the joinpoint has external linkage, false otherwise
 */
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

/**
 * Checks if a given joinpoint represents an identifier with internal linkage
 * 
 * @param $jp The joinpoint to evaluate
 * @returns  True if the joinpoint has internal linkage, false otherwise
 */
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

/**
 * Determines if an identifier is duplicated in a collection of join points
 *
 * @param $jp The identifier to evaluate
 * @param $others Other join points to compare with
 * @returns True if a duplicate exists, false otherwise
 */
export function isIdentifierDuplicated($jp: Joinpoint, $others: Joinpoint[]) {
    return $others.some((identifier) => identifier.astId !== $jp.astId && !isSameVarDecl($jp, identifier) && areIdentifierNamesEqual($jp, identifier));
}

/**
 * Checks if another identifier with the same name is declared before the given joinpoint
 *
 * @param $jp The identifier join point to check
 * @param $others The list of other identifiers to compare with
 * @returns True if a matching identifier is declared earlier, false otherwise.
 */

export function isIdentifierNameDeclaredBefore($jp: Joinpoint, $others: Joinpoint[]) {
    return $others.some((identifier) =>  {
        return identifier.astId !== $jp.astId && !isSameVarDecl($jp, identifier) && compareLocation(identifier, $jp) < 0 && areIdentifierNamesEqual(identifier, $jp)
    });
}

/**
 * @returns Returns true if the identifiers represent different AST nodes but are not distinct within the first 31 characters. Otherwise returns false.
 */
export function areDistinctIdentifiers($jp1: Vardecl | FunctionJp, $jp2: Vardecl | FunctionJp): boolean {
    try {
        return $jp1.astId !== $jp2.ast && $jp1.name.substring(0, 31) !== $jp2.name.substring(0, 31);
    } catch (error) {
        return false;
    }
}