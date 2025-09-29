import { FileJp, FunctionJp, Joinpoint, QualType, StorageClass, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getIdentifierName, isExternalLinkageIdentifier } from "./IdentifierUtils.js";
import { getExternalLinkageIdentifiers, getExternalLinkageVars, getExternalVarRefs } from "./ProgramUtils.js";
import { findFilesReferencingHeader } from "./FileUtils.js";

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
 * Retrieves all external references of the given variable
 * 
 * @param $varDecl variable to match by name.
 * @returns Array of external references with the same name as the given variable.
 */
export function findExternalVarRefs($varDecl: Vardecl): Vardecl[] {
    return getExternalVarRefs().filter(ref => ref.name === $varDecl.name);
}

/**
 * Identifies functions in the same file that reference the specified variable declaration
 *
 * @param $jp The variable declaration
 * @returns An array of functions that reference the variable
 */
export function findReferencingFunctions($jp: Vardecl): FunctionJp[] {
    const fileJp = $jp.getAncestor("file");
    const functionsJp = Query.searchFrom(fileJp, FunctionJp).get();
    
    return functionsJp
        .filter(funcJp => 
            Query.searchFrom(funcJp, Varref, {decl: (declJp) => declJp?.astId === $jp.astId}).get().length > 0
        );
}

/**
 * Finds duplicate definitions of the given variable declaration among external linkage variables
 *
 * @param $jp The variable declaration to evaluate
 * @returns An array of variable declarations representing duplicates
 */
export function findDuplicateVarDefinition($jp: Vardecl): Vardecl[] {
    return getExternalLinkageVars().filter((varDeclJp) => varDeclJp.astId !== $jp.astId && isSameVarDecl(varDeclJp, $jp));   
}

/**
 * Checks whether two joinpoints represent the same variable declaration by comparing identifier name, type, and external linkage
 *
 * @param $jp1 The first join point
 * @param $jp2 The second join point
 * @returns True if both are equivalent external variable declarations, false otherwise
 */
export function isSameVarDecl($jp1: Joinpoint, $jp2: Joinpoint): boolean {
    return $jp1 instanceof Vardecl && $jp2 instanceof Vardecl &&
            isExternalLinkageIdentifier($jp1) && isExternalLinkageIdentifier($jp2) &&
            getIdentifierName($jp1) === getIdentifierName($jp2) &&
		    $jp1.type.code === $jp2.type.code
}

/**
 * Checks if the given variable has multiple external linkage declarations across different files
 *
 * @param $jp The variable declaration to evaluate
 * @returns True if multiple external declarations exist, false otherwise
 */

export function hasMultipleExternalLinkDeclarations($jp: Vardecl): boolean {
    return getExternalLinkageIdentifiers().some(identifier => 
        isSameVarDecl(identifier, $jp) && identifier.getAncestor("file").ast !== $jp.getAncestor("file").ast
    );
}

/**
 * Checks whether the given variable declaration is used in its file or in files that include its header.
 *
 * @param varDecl The variable declaration to check
 * @returns True if the variable is referenced, false otherwise
 */
export function isVarUsed(varDecl: Vardecl): boolean {
    const fileJp = varDecl.getAncestor("file") as FileJp;
    let referencingFiles: FileJp[];

    if (fileJp.isHeader) {
        const filesWithInclude = findFilesReferencingHeader(fileJp.name);
        referencingFiles = [fileJp, ...filesWithInclude];
    } else {
        referencingFiles = [fileJp];
    }
    return referencingFiles.some(fileJp => Query.searchFrom(fileJp, Varref, {name: varDecl.name, decl: (declJp) => declJp?.astId === varDecl.astId}).get().length > 0)
}