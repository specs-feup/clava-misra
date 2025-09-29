import { Joinpoint, Type, PointerType, ArrayType, RecordJp, EnumDecl, DeclStmt, Program, QualType, Include } from "@specs-feup/clava/api/Joinpoints.js";

export type TagDecl = RecordJp | EnumDecl;

export function isTagDecl($jp: Joinpoint):  $jp is TagDecl {
    return $jp instanceof RecordJp || $jp instanceof EnumDecl;
}

/**
 * Checks if the provided node has a defined type
 * @param $jp The joinpoint to check its type
 * @returns true if the joinpoint has a defined type, otherwise false
 */
export function hasDefinedType($jp: Joinpoint): boolean {
    return $jp.hasType && $jp.type !== null && $jp.type !== undefined;
}

/**
 * Retrieves the base type of the provided joinpoint. 
 * @param $jp The joinpoint to retrieve its type
 * @returns The base type of the joinpoint, or undefined if the joinpoint does not have a type
 */
export function getBaseType($jp: Joinpoint): Type | undefined {
    if (!hasDefinedType($jp)) return undefined;
    let jpType = $jp.type instanceof QualType ? $jp.type.unqualifiedType : $jp.type;

    while (jpType instanceof PointerType || jpType instanceof ArrayType) {
        jpType = jpType instanceof PointerType ? jpType.pointee : jpType.elementType;
    } 
    return jpType;
}

/**
 * Gets the file path of the given join point.
 * @param $jp The join point
 * @returns The file path string
 */
export function getFilepath($jp: Joinpoint): string {
    return $jp instanceof Include ? $jp.parent.filepath : $jp.filepath;
}

/**
 * Returns the exact location of a given join point
 * @param $jp The joinpoint to evaluate
 * @returns A location string containing the filepath, line and column in the format "filepath@line:column"
 */
export function getFileLocation($jp: Joinpoint) {
    if ($jp instanceof Include && $jp.line === undefined) {
        return `${$jp.parent?.filepath}`;
    }
    return `${$jp.filepath}@${$jp.line}:${$jp.column}`
}

/**
 * Orders two join points by their source location: filepath, line, and column
 *
 * @param $jp1 The first join point
 * @param $jp2 The second join point
 * @returns  A negative value if $jp1 comes before $jp2, positive if after, or 0 if equal.
 */
export function compareLocation($jp1: Joinpoint, $jp2: Joinpoint): number {
    const filepath1 = getFilepath($jp1), filepath2 = getFilepath($jp2);
    
    if (filepath1 !== filepath2) return getFileLocation($jp1).localeCompare(getFileLocation($jp2));

    if (($jp1 instanceof Include) && !($jp2 instanceof Include)) return -1;
    if (!($jp1 instanceof Include) && ($jp2 instanceof Include)) return 1;

    return $jp1.line !== $jp2.line ? $jp1.line - $jp2.line : $jp1.column - $jp2.column;
}