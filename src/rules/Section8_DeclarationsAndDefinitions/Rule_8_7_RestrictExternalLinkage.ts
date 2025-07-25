import { FunctionJp, Joinpoint, Program, StorageClass, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isExternalLinkageIdentifier } from "../../utils/IdentifierUtils.js";
import { findExternalVarRefs, hasMultipleExternalLinkDeclarations, isVarUsed } from "../../utils/VarUtils.js";
import { findExternalFunctionDecl, isFunctionUsed } from "../../utils/FunctionUtils.js";
import { resetCaches } from "../../utils/ProgramUtils.js";

/**
 * Rule 8.7: Functions and objects should not be defined with external linkage if they are referenced in only one translation unit
 */
export default class Rule_8_7_RestrictExternalLinkage extends MISRARule {
    private externalDecls: FunctionJp[] | Vardecl[] = [];
    readonly analysisType = AnalysisType.SYSTEM;

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
        if (!isExternalLinkageIdentifier($jp) || ($jp instanceof FunctionJp && $jp.name === "main")) {
            return false;
        } 

        this.externalDecls = $jp instanceof Vardecl ? findExternalVarRefs($jp) : findExternalFunctionDecl($jp as FunctionJp);
        const isUsed = this.externalDecls.some(decl => decl instanceof Vardecl ? isVarUsed(decl) : isFunctionUsed(decl));
        const nonCompliant = this.externalDecls.length === 0 || !isUsed; 
        if (nonCompliant && logErrors) {
            this.logMISRAError(
                $jp, 
                `${$jp instanceof FunctionJp ? "Function" : "Object"} '${getIdentifierName($jp)}' has external linkage but is only referenced within a single translation unit. Consider using the 'static' keyword to give it internal linkage.`
            );
            this.externalDecls.forEach(decl => this.logMISRAError(decl, `'extern' declaration of '${getIdentifierName(decl)}' is unused. The corresponding definition is not referenced outside its translation unit and does not require external linkage.`))
        } 
        return nonCompliant;
    }

    /**
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        const previousResult =  this.context.getRuleResult(this.ruleID, $jp);
        if (previousResult === MISRATransformationType.NoChange || !this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        } 

        if ($jp instanceof Vardecl && hasMultipleExternalLinkDeclarations($jp)) {
            this.logMISRAError(
                $jp, 
                `${$jp instanceof FunctionJp ? "Function" : "Object"} '${getIdentifierName($jp)}' has external linkage but is only referenced within a single translation unit. Couldn't give it internal linkage as it is defined in multiple files.`)
            this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
        
        ($jp as Vardecl | FunctionJp).setStorageClass(StorageClass.STATIC);
        this.externalDecls.forEach(decl => decl instanceof FunctionJp ? decl.detach() : decl.parent.detach());
        resetCaches();
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
