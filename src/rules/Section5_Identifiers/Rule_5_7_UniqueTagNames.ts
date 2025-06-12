import { Joinpoint, TypedefDecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isIdentifierDecl, isIdentifierDuplicated, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getTypeDefDecl } from "../../utils/TypeDeclUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isTagDecl } from "../../utils/JoinpointUtils.js";

/**
 * Rule 5.6: A tag name shall be a unique identifier.
 * 
 * Exception: The tag name may be the same as the typedef name with which it is  associated.
 */
export default class Rule_5_7_UniqueTagNames extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.7";
    }


    /**
     * Checks whether the given joinpoint represents an identifier that has the same name as any tag (i.e., enum, union or struct)
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
        const tagDecls = Query.search(Joinpoint, (jp => {return isTagDecl(jp)})).get();
        let nonCompliant;
        if ($jp instanceof TypedefDecl) {
            const tagsWithSameName = tagDecls.filter((tag) => jpName === getIdentifierName(tag) && getTypeDefDecl(tag)?.ast !== $jp.ast);
            nonCompliant = tagsWithSameName.length > 0;
        } else {
            nonCompliant = isIdentifierDuplicated($jp, tagDecls);
        }

        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, `Identifier ${jpName} is also the name of a tag. Tag identifiers must not be reused.`);
        }
        return nonCompliant;
    }

    /**
     * Renames the provided joinpoint if it represents an identifier that conflits with a tag name (i.e., enum, union or struct)
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
            this.logMISRAError($jp, `Identifier ${getIdentifierName($jp)} is also the name of a tag. Tag identifiers must not be reused.`);
            this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }
}
