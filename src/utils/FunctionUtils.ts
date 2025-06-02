import { Call, Param, Joinpoint, Varref, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
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

export function findFunctionDef(callJp: Call, pathSuffix: string) {
    return Query.search(FunctionJp, (func) => {
                try {
                    return func.name === callJp.name && func.isImplementation && func.filepath.endsWith(pathSuffix)
                } catch (error) {
                    return false;
                }
            }).first();
}

export function findFunctionDeclarations(funcDefJp: FunctionJp): FunctionJp[] {
    return Query.search(FunctionJp, (func) => {
                try {
                    return func.astId !== funcDefJp.astId && 
                            func.name === funcDefJp.name && 
                            !func.isImplementation && 
                            func.returnType === funcDefJp.returnType
                } catch (error) {
                    return false;
                }
            }).get();
}

export function findFunctionCalls(funcDefJp: FunctionJp): Call[] {
    return Query.search(Call, (callJp) => {
                try {
                    return callJp.name === funcDefJp.name;
                } catch (error) {
                    return false;
                }
            }).get();
}