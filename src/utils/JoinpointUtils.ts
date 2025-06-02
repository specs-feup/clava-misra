import { StorageClass, FunctionJp, Vardecl, Joinpoint, Type, PointerType, ArrayType, RecordJp, EnumDecl, DeclStmt, TypedefDecl, LabelStmt, NamedDecl } from "@specs-feup/clava/api/Joinpoints.js";
import { getExternalVarRefs } from "./VarUtils.js";

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

export function getVarDeclsInScope($scope: Joinpoint): Vardecl[] {
    let result: Vardecl[] = [];

    for (const child of $scope.children) {
        if (child instanceof DeclStmt) {
            const vardecls = child.decls.filter((jp) => jp instanceof Vardecl);
            result.push(...vardecls);
        }
    }
    return result;
}