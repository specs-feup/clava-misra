import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { Vardecl, Joinpoint, Type, PointerType, ArrayType, RecordJp, EnumDecl, DeclStmt } from "@specs-feup/clava/api/Joinpoints.js";
import path from "path";

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
    let jpType = $jp.type;

    while (jpType instanceof PointerType || jpType instanceof ArrayType) {
        jpType = jpType instanceof PointerType ? jpType.pointee : jpType.elementType;
    } 
    return jpType;
}

export function formatLocation(filepath: String, line: number, column: number): string {
    return `${filepath}@${line}:${column}`
}

export function getFileLocation($jp: Joinpoint) {
    return formatLocation($jp.filepath, $jp.line, $jp.column);
}

export function getRelativeFileLocation($jp: Joinpoint) {
    const fullPath = $jp.filepath;
    const lastFolder = path.basename(Clava.getBaseFolder());
    const index = fullPath.indexOf(lastFolder);
    const relativeFolder = index !== -1 ? fullPath.slice(index) : fullPath;
    return formatLocation(relativeFolder, $jp.line, $jp.column);

}

export function compareLocation($jp1: Joinpoint, $jp2: Joinpoint): number {
    if ($jp1.filepath !== $jp2.filepath) {
        return getFileLocation($jp1).localeCompare(getFileLocation($jp2));
    }
    return $jp1.line !== $jp2.line ? $jp1.line - $jp2.line : $jp1.column - $jp2.column;
}