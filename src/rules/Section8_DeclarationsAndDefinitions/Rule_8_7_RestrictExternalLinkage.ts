import { FunctionJp, Joinpoint, Program, StorageClass, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isExternalLinkageIdentifier } from "../../utils/IdentifierUtils.js";
import { findExternalVarRefs, hasMultipleExternalLinkDeclarations } from "../../utils/VarUtils.js";
import { findExternalFunctionDecl } from "../../utils/FunctionUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { resetCaches } from "../../utils/ProgramUtils.js";

/**
 * Rule 8.7: Functions and objects should not be defined with external linkage if they are referenced in only one translation unit
 */
export default class Rule_8_7_RestrictExternalLinkage extends MISRARule {
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "8.7";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!isExternalLinkageIdentifier($jp) || ($jp instanceof FunctionJp && $jp.ast === (Query.root() as Program).main?.ast)) {
            return false;
        } 

        const nonCompliant = $jp instanceof Vardecl ? findExternalVarRefs($jp).length === 0 : findExternalFunctionDecl($jp as FunctionJp).length === 0;
        if (nonCompliant && logErrors) {
            this.logMISRAError(
                $jp, 
                `${$jp instanceof FunctionJp ? "Function" : "Object"} '${getIdentifierName($jp)}' has external linkage but is only referenced within a single translation unit. Consider using the 'static' keyword to give it internal linkage.`
            );
        } 
        return nonCompliant;
    }

    /**
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        } 

        if ($jp instanceof Vardecl && hasMultipleExternalLinkDeclarations($jp)) {
            this.logMISRAError(
                $jp, 
                `${$jp instanceof FunctionJp ? "Function" : "Object"} '${getIdentifierName($jp)}' has external linkage but is only referenced within a single translation unit. Couldn't give it internal linkage as it is defined in multiple files.`)
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
        
        ($jp as Vardecl | FunctionJp).setStorageClass(StorageClass.STATIC);
        resetCaches();
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
