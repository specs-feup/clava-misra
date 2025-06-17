import { FunctionJp, Joinpoint, QualType, StorageClass, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Retrieves all variable references qualified as "volatile" starting from the given joinpoint
 * @param $jp Starting joinpoint
 * @returns Array of variable references qualified as volatile
 */
export function getVolatileVarRefs($jp: Joinpoint): Varref[] {
    return Query.searchFromInclusive($jp, Varref, (ref) => {
        try {
            return ref.type instanceof QualType && ref.type.qualifiers?.includes("volatile")
        } catch (error) {
            return false;
        }
     }).get();
}

/**
 * Retrieves all external references of the given variable.
 * @param $varDecl variable to match by name.
 * @returns Array of external references with the same name as the given variable.
 */
export function findExternalVarRefs($varDecl: Vardecl): Vardecl[] {
    return Query.search(Vardecl, (ref) => {
            return ref.storageClass === StorageClass.EXTERN && ref.name === $varDecl.name;
        }).get();
}

export function findReferencingFunctions($jp: Vardecl): FunctionJp[] {
    const fileJp = $jp.getAncestor("file");
    const functionsJp = Query.searchFrom(fileJp, FunctionJp).get();
    
    return functionsJp
        .filter(funcJp => 
            Query.searchFrom(funcJp, Varref, {decl: (declJp) => declJp?.astId === $jp.astId}).get().length > 0
        );
}
