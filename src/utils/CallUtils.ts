import { Call, FileJp, FunctionJp, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getIncludesOfFile } from "./FileUtils.js";
import { findExternalFunctionDecl } from "./FunctionUtils.js";
import { getFileLocation } from "./JoinpointUtils.js";

/**
 * Checks if the given joinpoint represents a call to an implicit function.
 *
 * @param callJp The call join point to analyze
 */
export function isCallToImplicitFunction(callJp: Call): boolean {
    if ( callJp.function?.isInSystemHeader) { // Call to system header function
        return false;
    } 

    const varrefs = Query.searchFrom(callJp, Varref, {isFunctionCall: false}).get().map(varRef => varRef.astId);
    const args = new Set(callJp.argList.flatMap(arg => Query.searchFromInclusive(arg, Varref).get().map(varRef => varRef.astId)));
    if (varrefs.length > 0 && !args.has(varrefs[0])) { // Call using function pointer
        return false;
    }
    
    const directCallee = callJp.directCallee;
    if (directCallee === undefined) return true;
    
    const fileJp = directCallee.getAncestor("file");
    if (fileJp === undefined) return true;

    return Query.searchFrom(fileJp, FunctionJp, {name: callJp.name}).get().length === 0;
}

/**
 * Computes the index of a call in a file
 * @param fileJp The file to search in
 * @param callJp The call to find
 * @returns The index of the call or -1 if not found 
 */
export function getCallIndex(fileJp: FileJp, callJp: Call): number {
    return Query.searchFrom(fileJp, Call, { name: callJp.name }).get().findIndex(c => c.equals(callJp));
}