import {Joinpoint} from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getInternalLinkageIdentifiers } from "../../utils/ProgramUtils.js";
import { getIdentifierName, isIdentifierDecl, isIdentifierDuplicated, renameIdentifier } from "../../utils/IdentifierUtils.js";

/**
 * Rule 5.9: Identifiers that define objects or functions with internal linkage should be unique
 */
export default class Rule_5_9_UniqueInternalLinkIdentifiers extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.9";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!isIdentifierDecl($jp)) {
            return false;
        } 

        const jpName = getIdentifierName($jp);
        const internalLinkageIdentifiers = getInternalLinkageIdentifiers();
        const nonCompliant = isIdentifierDuplicated($jp, internalLinkageIdentifiers);
        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, `Identifier ${jpName} is already defined with internal linkage in this or other file.`);
        }
        return nonCompliant;
    }

    /**
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        const previousResult = isIdentifierDecl($jp) ? this.context.getRuleResult(this.ruleID, $jp) : undefined;
        if (previousResult === MISRATransformationType.NoChange || !this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);   
        }
        const newName = this.context.generateIdentifierName($jp)!;
        if (renameIdentifier($jp, newName)) {
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } else {
            this.logMISRAError($jp, `Identifier name is already defined with internal linkage in this or other file.`);
            this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }
}
