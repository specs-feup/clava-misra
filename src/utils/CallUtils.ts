import { Call, FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getIncludesOfFile } from "./FileUtils.js";
import { findExternalFunctionDecl } from "./FunctionUtils.js";

/**
 * Check if the given joinpoint represents a call to an implicit function.
 *
 * @param callJp The call join point to analyze
 */
export function isCallToImplicitFunction(callJp: Call): boolean {
    if (callJp.function.isInSystemHeader) {
        return false;
    }

    if (callJp.function.definitionJp === undefined) {
        return !callJp.function.isInSystemHeader;
    } 
    
    const definitionJp = callJp.directCallee.definitionJp;
    const defLocation = callJp.function.definitionJp.getAncestor("file") as FileJp;
    const callLocation = callJp.getAncestor("file") as FileJp;
    const fileIncludes = getIncludesOfFile(callLocation);

    if (defLocation.ast === callLocation.ast) { // calling the definition
        return false;
    }

    return !findExternalFunctionDecl(definitionJp)
            .some((declJp) => {
                const declLocation = declJp.getAncestor("file") as FileJp;
                return declLocation?.ast === callLocation.ast || 
                       (declLocation.isHeader && fileIncludes.includes(declLocation.name))
            });
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