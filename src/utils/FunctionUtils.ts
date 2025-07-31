import { Param, Joinpoint, Varref, FunctionJp, StorageClass, GotoStmt, LabelStmt, FileJp, Call, VariableArrayType } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { findFilesReferencingHeader } from "./FileUtils.js";
import { hasDefinedType } from "./JoinpointUtils.js";

/**
 * Gets direct references to a parameter within a function
 * @param $param Parameter to find references for
 * @param functionJp Function joinpoint to search in
 */
export function getDirectParamReferences($param: Param, functionJp: FunctionJp): Varref[] {
    return Query.searchFrom(functionJp, Varref, (ref) => { return ref.decl?.astId === $param.astId}).get();
}

/**
 * Gets variable references to a parameter inside Variable-Length Array (VLA) fields
 * @param $param Parameter to find references for
 * @param functionJp Function joinpoint to search in 
 */
export function getVLAFieldParamReferences($param: Param, functionJp: FunctionJp): Varref[] { 
    const vlaJoinpoints = functionJp.descendants.filter(jp => hasDefinedType(jp) && jp.type instanceof VariableArrayType);
    const fieldsInVLAs = vlaJoinpoints.flatMap(jp => jp.jpFieldsRecursive.flatMap(field => [field, ...field.descendants]));

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

export function getUnusedLabels(func: FunctionJp): LabelStmt[] {
    return Query.searchFrom(func, LabelStmt).get().filter(label => 
        Query.searchFrom(func, GotoStmt, { label: jp => jp.astId === label.decl.astId }).get().length === 0
    );
}

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

export function findExternalFunctionDecl(functionJp: FunctionJp): FunctionJp[] {
    return functionJp.declarationJps
            .filter((declJp) => declJp.storageClass === StorageClass.EXTERN);
}

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