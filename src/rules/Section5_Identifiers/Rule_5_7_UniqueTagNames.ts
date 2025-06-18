import { Joinpoint, Program, TypedefDecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isIdentifierDuplicated, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getTypeDefDecl } from "../../utils/TypeDeclUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isTagDecl } from "../../utils/JoinpointUtils.js";
import { getIdentifierDecls, rebuildProgram } from "../../utils/ProgramUtils.js";

/**
 * Rule 5.6: A tag name shall be a unique identifier.
 * 
 * Exception: The tag name may be the same as the typedef name with which it is  associated.
 */
export default class Rule_5_7_UniqueTagNames extends MISRARule {
    private invalidIdentifiers: any[] = []; // TODO: use IdentifierJp

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
        if (!($jp instanceof Program)) return false;

        const tagDecls = Query.search(Joinpoint, (jp => {return isTagDecl(jp)})).get();
        this.invalidIdentifiers = getIdentifierDecls().filter((identifierJp) => 
        {
            identifierJp instanceof TypedefDecl ?
                tagDecls.filter((tag) =>
                    getIdentifierName(identifierJp) === getIdentifierName(tag) &&
                    getTypeDefDecl(tag)?.ast !== identifierJp.ast
                ).length > 0
                : isIdentifierDuplicated(identifierJp, tagDecls);
        });
        const nonCompliant = this.invalidIdentifiers.length > 0;

        if (nonCompliant && logErrors) { 
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is also the name of a tag. Tag identifiers must not be reused.`);
            })
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
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);   
        }

        for (const identifierJp of this.invalidIdentifiers) {
            const newName = this.context.generateIdentifierName(identifierJp)!;
            renameIdentifier(identifierJp, newName);
        }
        rebuildProgram();
        return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
    }
}
