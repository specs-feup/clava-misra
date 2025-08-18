import { Joinpoint, TypedefDecl, DeclStmt, TypedefType, ElaboratedType, TagType, FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getBaseType } from "./JoinpointUtils.js";
import { isTagDecl, TagDecl } from "./JoinpointUtils.js";
import { findFilesReferencingHeader, getIncludesOfFile } from "./FileUtils.js";

/**
 * Retrieves the typedef declaration for the provided joinpoint, if available
 * @param $jp The joinpoint to analyze
 * @returns The typedef declaration if found, or undefined if not
 */
export function getTypeDefDecl($jp: Joinpoint): TypedefDecl | undefined {
    if ($jp instanceof DeclStmt && $jp.children.length === 1 && $jp.children[0] instanceof TypedefDecl)
        return $jp.children[0];

    if (isTagDecl($jp)) {
        const typeDecls = Query.searchFrom($jp, TypedefDecl).get(); 
        if (typeDecls.length === 1)
            return typeDecls[0];
    }
}

/**
 * Checks if the provided joinpoint declares a type (typedef)
 * @param $jp The joinpoint to check
 * @returns Returns true if the joinpoint declares a typedef, otherwise false
 */
export function hasTypeDefDecl($jp: Joinpoint): boolean {
    return getTypeDefDecl($jp) !== undefined;
}


/**
 * Checks if a given joinpoint uses the specified typedef declaration.
 * @param jp - The joinpoint to check
 * @param typeDecl - The typedef declaration to check against
 * @returns Returns true if the joinpoint uses the given typedef declaration, false otherwise
 */
export function jpUsesTypedef(jp: Joinpoint, typeDecl: TypedefDecl): boolean {
    const jpType = getBaseType(jp);

    return !jpType?.isBuiltin && 
        jpType instanceof TypedefType && 
        jpType.decl.astId === typeDecl.astId;
}

/**
 * Checks if a given joinpoint uses the specified tag declaration
 * @param $jp The joinpoint to analyze
 * @param tag The tag to check against
 * @returns Returns true if the joinpoint uses the given tag, false otherwise
 */
export function jpUsesTag($jp: Joinpoint, tag: TagDecl): boolean {
    const jpType = getBaseType($jp);
    return jpType instanceof ElaboratedType && 
        jpType.namedType instanceof TagType && 
        jpType.namedType.decl.astId === tag.astId &&
        $jp.astId !== getTypeDefDecl(tag)?.astId
}

/**
 * Checks if the provided typedef or tag declaration is used in any part of the program
 * @param decl - typedef or tag declaration to verify
 * @returns Returns true if the declaration is used, false otherwise
 */
export function isTypeDeclUsed(decl: TypedefDecl | TagDecl): boolean {
    const fileJp = decl.getAncestor("file") as FileJp;
    let jps: Joinpoint[] = [];

    if (fileJp.isHeader) {
        const referencingFiles = findFilesReferencingHeader(fileJp.name);
        jps = [...fileJp.descendants, ...referencingFiles.flatMap(file => file.descendants)];
    } else {
        jps = fileJp.descendants;
    }
    
    return decl instanceof TypedefDecl ? 
        jps.some(jp => jpUsesTypedef(jp, decl)) :
        jps.some(jp => jpUsesTag(jp, decl));
}