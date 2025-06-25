import { Param, Joinpoint, Varref, FunctionJp, StorageClass } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

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

export function findFunctionDef(functionName: string, pathSuffix: string) {
    return Query.search(FunctionJp, (func) => {
                try {
                    return func.name === functionName && func.isImplementation && func.filepath.endsWith(pathSuffix)
                } catch (error) {
                    return false;
                }
            }).first();
}

export function findExternalFunctionDecl(functionJp: FunctionJp): FunctionJp[] {
    return functionJp.declarationJps
            .filter((declJp) => declJp.storageClass === StorageClass.EXTERN);
}