import { StorageClass, FunctionJp, Vardecl, FileJp, Joinpoint, Type, PointerType, ArrayType, RecordJp, EnumDecl } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

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

/**
 * Checks if a storage class has external linkage
 * @param $class - The storage class to check
 * @returns Returns true if the class has external linkage, otherwise returns false
 */
export function hasExternalLinkage($class: StorageClass) {
    return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
}

/**
 * Retrieves all variables and functions that are eligible for `extern` linkage, i.e., 
 * elements with storage classes that are not `STATIC` or `EXTERN`
 * @returns Array of functions and variables that can be declared as external
 */
export function getExternals(): (FunctionJp | Vardecl)[] {
    let result: (FunctionJp | Vardecl)[] = [];

    for (const file of Query.search(FileJp).get()) {
        for(const child of file.children) {
            if((child instanceof Vardecl || child instanceof FunctionJp) && hasExternalLinkage(child.storageClass)) {
                result.push(child);
            }
        }
    }
    return result;
}

/**
 * Retrieves all variables that are eligible for `extern` linkage, i.e., 
 * variable declarations with storage classes that are not `STATIC` or `EXTERN`
 * 
 * @returns Array of variables that can be declared as external
 */
export function getExternalVarDecls(): Vardecl[] {
    return Query.search(Vardecl, (varDeclJp) => {
        return hasExternalLinkage(varDeclJp.storageClass);
    }).get();
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