import {Case, Joinpoint, Switch, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { areDistinctIdentifiers, getExternalVarDecls, hasExternalLinkage } from "../../utils/JoinpointUtils.js";
import { getExternalVarRefs } from "../../utils/VarUtils.js";

/**
 * Rule 5.1 External identifiers shall be distinct.
 */
export default class Rule_5_1_DistinctExternalIdentifiers extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.1";
    }

    /**
     * Checks if the given joinpoint is an external identifier distinct from other external identifiers.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Vardecl) || !hasExternalLinkage($jp.storageClass)) {
            return false;
        } 
        
        const externableVarDecls = getExternalVarDecls();
        console.log(externableVarDecls.length);
        const nonCompliant = externableVarDecls.some((varJp) => !areDistinctIdentifiers(varJp, $jp) && varJp.astId !== $jp.astId);
        console.log("nonCompliant:" , nonCompliant);

        if (nonCompliant && logErrors) {
            for (const varJp of externableVarDecls) {
                if (!areDistinctIdentifiers(varJp, $jp)) {
                    this.logMISRAError($jp, `Identifier ${$jp.name} is not distinct from other external identifiers within the first 31 characters.`)
                }
            }
        }
        return nonCompliant;
    }

    /**
     * Changes the name of an external identifier that is not distinct from others.
     * External references are also updated to use the new name.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        const varDecl = $jp as Vardecl;
        const newName = this.context.generateVarName();
        const externalRefs = getExternalVarRefs(varDecl);

        varDecl.setName(newName);
        for (const varRef of externalRefs) {
            varRef.setName(newName);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
