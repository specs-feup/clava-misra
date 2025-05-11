import { Call, Param, Joinpoint, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Check if the given joinpoint represents a call to an implicit function.
 *
 * @param callJp The call join point to analyze
 */
export function isCallToImplicitFunction(callJp: Call): boolean {
    return callJp.function.definitionJp === undefined && !callJp.function.isInSystemHeader;
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