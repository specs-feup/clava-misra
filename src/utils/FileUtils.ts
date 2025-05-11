import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Program, Include, Call } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isCallToImplicitFunction } from "./FunctionUtils.js";

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