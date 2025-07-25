import { Param, Joinpoint, Varref, FunctionJp, StorageClass, GotoStmt, LabelStmt, FileJp, Call } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { findFilesReferencingHeader } from "./FileUtils.js";

/**
 * Retrieves all variable references to a given parameter
 * @param $param 
 * @param $startingPoint 
 * @returns 
 */
export function getParamReferences($param: Param, $startingPoint: Joinpoint): Varref[] {
    return Query.searchFrom($startingPoint, Varref, (ref) => {
                try {
                    return ref.decl && ref.decl.astId === $param.astId;
                } catch (error) {
                    return false;
                }
            }).get();
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