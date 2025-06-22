import { FunctionJp, Joinpoint, QualType, StorageClass, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getIdentifierName, isExternalLinkageIdentifier } from "./IdentifierUtils.js";
import { getExternalLinkageIdentifiers } from "./ProgramUtils.js";

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

export function findDuplicateVarDefinition($jp: Vardecl): Vardecl[] {
    return Query.search(Vardecl, (varDeclJp) => varDeclJp.astId !== $jp.astId && isSameVarDecl(varDeclJp, $jp)).get();   
}

export function isSameVarDecl($jp1: Joinpoint, $jp2: Joinpoint): boolean {
    return $jp1 instanceof Vardecl && $jp2 instanceof Vardecl &&
            isExternalLinkageIdentifier($jp1) && isExternalLinkageIdentifier($jp2) &&
            getIdentifierName($jp1) === getIdentifierName($jp2) &&
		    $jp1.type.code === $jp2.type.code
}

export function hasMultipleExternalLinkDeclarations($jp: Vardecl): boolean {
    for (const identifier of getExternalLinkageIdentifiers()) {
        if (isSameVarDecl(identifier, $jp) && identifier.getAncestor("file").ast !== $jp.getAncestor("file").ast) {
            return true;
        }
    }
    return false;
}