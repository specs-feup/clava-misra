import { FileJp, Include, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import * as path from 'path';

/**
 * MISRA Rule 20.2: The ', " or \ characters and the /* or // character sequences shall not occur in a header filename
 */
export default class Rule_20_2_InvalidHeaderFileName extends MISRARule {
    constructor(context: MISRAContext) {
        super("20.2", context);
    }

    /**
     * Checks if the given joinpoint is a header file whose name includes invalid characters.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FileJp && $jp.isHeader)) return false;

        const isNonCompliant = /.*('|"|\\|\/\*|\/\/).*/.test($jp.name);
        if (isNonCompliant && logErrors) {
            this.logMISRAError($jp, `Invalid characters in header filename. Invalid characters are ', ", \\, and the sequences /* and //.`)
        }
        return isNonCompliant;
    }

    /**
     * Renames a header file to ensure it contains only valid characters and updates all related includes accordingly.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    
        const fileJp = $jp as FileJp;
        const includesOfHeader = this.getMatchingIncludes(fileJp);
        const newFilename = this.context.generateHeaderFilename();
    
        fileJp.setName(newFilename);
        this.updateIncludes(includesOfHeader, newFilename);
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
    
    /**
     * Finds all include joinpoints that reference a specific header file 
     * 
     * @param headerFileJp - The header file joinpoint
     * @returns List of matching include statements
     */
    private getMatchingIncludes(headerFileJp: FileJp): Include[] {
        return Query.search(Include).get().filter(includeJp =>
            path.basename(includeJp.name) === headerFileJp.name &&
            this.getHeaderFilePath(includeJp) === headerFileJp.path);
    }
    
    /**
     *  Computes the full path to the header file based on the include statement
     * 
     * @param includeJp The include joinpoint
     * @returns Resolved path to the header file
     */
    private getHeaderFilePath(includeJp: Include): string {
        try {
            if (includeJp.name.startsWith("../")) {
                return includeJp.relativeFolderpath;
            } else { 
                const relativeDir = path.dirname(includeJp.name);
                const fileJp = includeJp.getAncestor("file") as FileJp | undefined;
                return path.resolve(fileJp!.path, relativeDir);
            }
        } catch (error) {
            return "";
        }
    }

    /**
     * Updates the provided include joinpoints to reference the new header file name
     * 
     * @param includesOfHeader List of include joinpoints to update
     * @param newFilename The new filename for the header file
     */
    private updateIncludes(includesOfHeader: Include[], newFilename: string): void {
        for (const includeJp of includesOfHeader) {
            const fileJp = includeJp.getAncestor("file") as FileJp | undefined;
    
            const newIncludeJpName = this.getNewIncludeName(includeJp, newFilename);
            fileJp!.addInclude(newIncludeJpName);
    
            const tempInclude = Query.searchFrom(fileJp!, Include, {name: includeName => path.normalize(includeName) === newIncludeJpName}).first();
    
            if (tempInclude) {
                includeJp.replaceWith(tempInclude.deepCopy());
                tempInclude.detach();
            }
        }
    }
    
    /**
     * Computes the new include path with the updated header file name
     * 
     * @param includeJp - Original include statement
     * @param newHeaderFileName - New header file name
     * @returns The updated include path
     */
    private getNewIncludeName(includeJp: Include, newHeaderFileName: string): string {
        const isFile = path.extname(includeJp.name) !== '';
        const baseDir = isFile ? path.dirname(includeJp.name) : includeJp.name;

        return path.join(baseDir, newHeaderFileName);
    }
}
