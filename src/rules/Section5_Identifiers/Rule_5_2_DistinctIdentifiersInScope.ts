import {Joinpoint, StorageClass, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getVarDeclsInScope } from "../../utils/JoinpointUtils.js";
import { areDistinctIdentifiers, hasExternalLinkage } from "../../utils/IdentifierUtils.js";

/**
 * Rule 5.2: Identifiers declared in the same scope and name space shall be distinct
 */
export default class Rule_5_2_DistinctIdentifiersInScope extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.2";
    }

    /**
     * Changes the name of an identifier that is not distinct from others in the same scope.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Vardecl && !hasExternalLinkage($jp) && $jp.storageClass !== StorageClass.EXTERN)) {
            return false;
        }

        const varDeclsInScope = getVarDeclsInScope($jp.currentRegion);
        const nonCompliant = varDeclsInScope.some((decl) => !areDistinctIdentifiers(decl, $jp) && decl.astId !== $jp.astId);
        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, `Identifier "${$jp.name}" is not sufficiently distinct from other identifiers in the same scope within the first 31 characters.`);
        }
        return nonCompliant;
    }

    /**
     * Changes the name of an identifier that is not distinct from others in the same scope and name space.
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        const varDecl = $jp as Vardecl;
        const newName = this.context.generateIdentifierName($jp)!;
        varDecl.setName(newName);

        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
