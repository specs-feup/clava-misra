import { Joinpoint, QualType, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export function getVolatileVarRefs($jp: Joinpoint): Varref[] {
    return Query.searchFromInclusive($jp, Varref, (ref) => {
        try {
            return ref.type instanceof QualType && ref.type.qualifiers?.includes("volatile")
        } catch (error) {
            return false;
        }
     }).get();
}
