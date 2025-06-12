import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isIdentifierDecl, isIdentifierDuplicated, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers } from "../../utils/ProgramUtils.js";

/**
 * Rule 5.8: Identifiers that defi ne objects or functions with external linkage shall be unique
 */
export default class Rule_5_8_UniqueExternalLinkIdentifiers extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.8";
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
        const externalLinkageIdentifiers = getExternalLinkageIdentifiers();
        const nonCompliant = isIdentifierDuplicated($jp, externalLinkageIdentifiers);

        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, `Identifier '${jpName}' is already defined with external linkage in this or other file.`);
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
            this.logMISRAError($jp, `Identifier '${getIdentifierName($jp)}' is already defined with external linkage in this or other file.`);
            this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }
}
