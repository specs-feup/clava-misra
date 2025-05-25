import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Program, Include, Call, FunctionJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isCallToImplicitFunction } from "./CallUtils.js";
import { hasExternalLinkage } from "./JoinpointUtils.js";

/**
 * Checks if a file compiles correctly after adding a statement by rebuilding it.
 * If rebuilding fails, the file is considered invalid with the new statement.
 * 
 * @param fileJp - The file to validate.
 */
export function isValidFile(fileJp: FileJp) : boolean {
    const programJp = fileJp.parent as Program;
    let copyFile = ClavaJoinPoints.fileWithSource(`temp_misra_${fileJp.name}`, fileJp.code, fileJp.relativeFolderpath);

    copyFile = programJp.addFile(copyFile) as FileJp;
    try {
        const rebuiltFile = copyFile.rebuild();
        const fileToRemove = Query.searchFrom(programJp, FileJp, {filepath: rebuiltFile.filepath}).first();
        fileToRemove?.detach();
        return true;
    } catch(error) {
        copyFile.detach();
        return false;
    }
}

/**
 * Retrieves the list of header files included in the given file
 *
 * @param fileJp The file join point
 * @returns An array of strings with the names of the includes
 */
export function getIncludesOfFile(fileJp: FileJp): string[] {
    return fileJp.includes.map(includeJp => includeJp.name);
}

/**
 * Removes a specific include directive from the given file, if it exists
 *
 * @param includeName The name of the include to remove 
 * @param fileJp The file from which the include should be removed
 */
export function removeIncludeFromFile(includeName: string, fileJp: FileJp) {
    const include = Query.searchFrom(fileJp, Include, {name: includeName}).first();
    include?.detach();
}

/**
 * Returns all files in the program that contain at least one call to an implicit function
 *
 * @param programJp - The program to analyze
 * @returns A list of files with implicit function calls
 */
export function getFilesWithCallToImplicitFunction(programJp: Program): FileJp[] {
    const files = Query.searchFrom(programJp, FileJp).get();
    return files.filter(
      (fileJp) =>
        Query.searchFrom(fileJp, Call, (callJp) =>
          isCallToImplicitFunction(callJp)
        ).get().length > 0
    );
} 

/**
 * Checks if the rebuilt version of the file compiles and if the provided call is no longer implicit.
 * 
 * @param fileJp The file to analyze
 * @param funcName The function name to search the call
 * @param callIndex The index of the call 
 */
export function isValidFileWithExplicitCall(fileJp: FileJp, funcName: string, callIndex: number, checkNumParams: boolean = false): boolean {
    const programJp = fileJp.parent as Program;
    let copyFile = ClavaJoinPoints.fileWithSource(`temp_misra_${fileJp.name}`, fileJp.code, fileJp.relativeFolderpath);

    copyFile = programJp.addFile(copyFile) as FileJp;
    try {
        const rebuiltFile = copyFile.rebuild();
        const fileToRemove = Query.searchFrom(programJp, FileJp, {filepath: rebuiltFile.filepath}).first() as FileJp;
        const callJp = Query.searchFrom(fileToRemove, Call, {name: funcName}).get().at(callIndex);
        let isExplicitCall = callJp !== undefined && !isCallToImplicitFunction(callJp);
        
        if (checkNumParams && isExplicitCall) {
            isExplicitCall = isExplicitCall && callJp!.args.length === callJp!.directCallee.params.length;
        }
        fileToRemove?.detach();
        return isExplicitCall;

    } catch(error) {
        copyFile.detach();
        return false;
    }
}

/**
 * 
 */
export function addExternFunctionDecl(fileJp: FileJp, functionJp: FunctionJp): Joinpoint | undefined {
    if (!hasExternalLinkage(functionJp.storageClass)) {
        return undefined;
    }

    let childAfterExtern: Joinpoint = fileJp.firstChild;
    
    while(childAfterExtern instanceof Include) {
        childAfterExtern = childAfterExtern.siblingsRight[0];
    }

    const externStr = `extern ${functionJp.getDeclaration(true)};`;
    const externStmt = ClavaJoinPoints.stmtLiteral(externStr);
    const newExternStmt = childAfterExtern.insertBefore(externStmt);
    return newExternStmt;
}