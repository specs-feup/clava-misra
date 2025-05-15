import { Call, Param, Joinpoint, Varref, FunctionJp, StorageClass, FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getIncludesOfFile } from "./FileUtils.js";

/**
 * Check if the given joinpoint represents a call to an implicit function.
 *
 * @param callJp The call join point to analyze
 */
export function isCallToImplicitFunction(callJp: Call): boolean {
    if (callJp.function.definitionJp === undefined) {
        return !callJp.function.isInSystemHeader;
    } 
    
    const defLocation = callJp.function.definitionJp.getAncestor("file") as FileJp;
    const callLocation = callJp.getAncestor("file") as FileJp;

    if (defLocation.ast === callLocation.ast) { // calling the definition
        return false;
    } 

    const functionExternDecls = Query.search(FunctionJp, (func) => {
        const declLocation = func.getAncestor("file") as FileJp;
        const fileIncludes = getIncludesOfFile(callLocation);

        return func.name === callJp.name && 
               !func.isImplementation && 
                func.storageClass === StorageClass.EXTERN &&
                (
                    declLocation?.ast === callLocation.ast || 
                    (declLocation.isHeader && fileIncludes.includes(declLocation.name))
                )

    }).get();

    return functionExternDecls.length === 0;
}

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