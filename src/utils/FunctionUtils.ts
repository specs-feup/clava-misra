import { Param, Varref, FunctionJp, StorageClass, GotoStmt, LabelStmt, FileJp, Call, VariableArrayType } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { findFilesReferencingHeader } from "./FileUtils.js";
import { hasDefinedType } from "./JoinpointUtils.js";

/**
 * Gets direct references to a parameter within a function
 * @param $param Parameter to find references for
 * @param functionJp Function joinpoint to search in
 */
export function getDirectParamReferences($param: Param, functionJp: FunctionJp): Varref[] {
    return Query.searchFrom(functionJp, Varref, (ref) => { return ref.decl && ref.decl.astId === $param.astId}).get();
}

/**
 * Gets variable references to a parameter inside Variable-Length Array (VLA) fields
 * @param $param Parameter to find references for
 * @param functionJp Function joinpoint to search in 
 */
export function getVLAFieldParamReferences($param: Param, functionJp: FunctionJp): Varref[] { 
    const vlaJoinpoints = functionJp.descendants.filter(jp => hasDefinedType(jp) && jp.type instanceof VariableArrayType);
    const fieldsInVLAs = vlaJoinpoints.flatMap(jp => jp.jpFields(true).flatMap(field => [field, ...field.descendants]));

    return fieldsInVLAs.filter(field => field instanceof Varref && field.decl?.astId === $param.astId) as Varref[];
}

/**
 * Gets all unique variable references to a parameter in a function.
 * @param $param Parameter to find references for
 * @param functionJp Function joinpoint to search in 
 * @returns Array of unique Varref references
 */
export function getParamReferences($param: Param, functionJp: FunctionJp): Varref[] {
    const directRefs = getDirectParamReferences($param, functionJp);
    const refsInVLAFields = getVLAFieldParamReferences($param, functionJp);
    
    // Remove duplicated nodes
    return Array.from(new Map([...directRefs, ...refsInVLAFields as Varref[]].map(ref => [ref.ast, ref])).values());
}

/**
 * Gets all label statements in the given function that are never referenced
 * @param func The function to analyze
 * @returns An array of unused labels statements
 */
export function getUnusedLabels(func: FunctionJp): LabelStmt[] {
    return Query.searchFrom(func, LabelStmt).get().filter(label => 
        Query.searchFrom(func, GotoStmt, { label: jp => jp.astId === label.decl.astId }).get().length === 0
    );
}

/**
 * Returns the first function definition matching the given name and file path suffix
 *
 * @param functionName Name of the function
 * @param pathSuffix File path suffix
 * @returns The function definition, or undefined if not found
 */

export function findFunctionDef(functionName: string, pathSuffix: string) {
    const funcDefs = Query.search(FunctionJp, (func) => {
                try {
                    return func.name === functionName && func.isImplementation && func.filepath.endsWith(pathSuffix)
                } catch (error) {
                    return false;
                }
            }).get();
    return funcDefs.length > 0 ? funcDefs[0] : undefined;
}

/**
 * Finds extern declarations for the given function
 * @param functionJp The function join point
 * @returns List of extern function declarations
 */
export function findExternalFunctionDecl(functionJp: FunctionJp): FunctionJp[] {
    return functionJp.declarationJps
            .filter((declJp) => declJp.storageClass === StorageClass.EXTERN);
}

/**
 * Checks if the given function is called anywhere in the project
 * @param functionJp The function to evaluate
 * @returns True if the function is used, false otherwise
 */
export function isFunctionUsed(functionJp: FunctionJp): boolean {
    const fileJp = functionJp.getAncestor("file") as FileJp;
    let referencingFiles: FileJp[];

    if (fileJp.isHeader) {
        const filesWithInclude = findFilesReferencingHeader(fileJp.name);
        referencingFiles = [fileJp, ...filesWithInclude];
    } else {
        referencingFiles = [fileJp];
    }
    return referencingFiles.some(fileJp => Query.searchFrom(fileJp, Call, {name: functionJp.name, directCallee: (jp) => jp?.ast === functionJp.ast}).get().length > 0)
}