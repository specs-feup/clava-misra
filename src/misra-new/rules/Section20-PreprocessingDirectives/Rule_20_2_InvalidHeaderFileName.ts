import { Case, FileJp, Include, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

/**
 * MISRA Rule 20.2: The ', " or \ characters and the /* or // character sequences shall 
 * not occur in a header filename
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
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const includesOfHeader = Query.search(Include, {relativeFolderpath: fldrPath => fldrPath === ($jp as FileJp).path, name: nameStr => nameStr === ($jp as FileJp).name}).get();
        const newFilename = this.context.generateHeaderFilename();

        // Rename the header file
        ($jp as FileJp).setName(newFilename);

        // Update related includes
        for (const includeJp of includesOfHeader) {
            const fileJp = includeJp.getAncestor("file") as FileJp;
            fileJp.addInclude(newFilename);
            const tempInclude = Query.searchFrom(fileJp, Include, {name: newFilename}).getFirst();

            includeJp.replaceWith(tempInclude!.deepCopy());   
            tempInclude?.detach()                                 
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
