import { FileJp, Joinpoint, Program, StorageClass, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers, resetCaches } from "../../utils/ProgramUtils.js";
import { compareLocation } from "../../utils/JoinpointUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isSameVarDecl } from "../../utils/VarUtils.js";

/**
 * Rule 8.6: An identifier with external linkage shall have exactly one external definition
 */
export default class Rule_8_6_SingleExternalDefinition extends MISRARule {
    priority = 2; 
    private invalidDecls: Vardecl[] = [];
    readonly analysisType = AnalysisType.SYSTEM;

    override get name(): string {
        return "8.6";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) {
            return false;
        } 

        const externalLinkageVars = getExternalLinkageIdentifiers().filter((identifierJp) => identifierJp instanceof Vardecl);
        this.invalidDecls = externalLinkageVars.filter((decl1) =>
          externalLinkageVars.some((decl2) =>
                isSameVarDecl(decl1, decl2) &&
                decl1.getAncestor("file").ast !== decl2.getAncestor("file").ast &&
                compareLocation(decl2, decl1) < 0
            )
        );

        const nonCompliant = this.invalidDecls.length > 0;
        if (nonCompliant && logErrors) {
            this.invalidDecls.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' with external linkage is defined in multiple files`)
            });
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

        let solved = false;
        const uniqueDecls = this.invalidDecls.reduce((acc: Vardecl[], decl1) => acc.some(decl2 => isSameVarDecl(decl1, decl2)) ? acc : [...acc, decl1], []);

        for (const decl of uniqueDecls) {
            if (this.context.getRuleResult(this.ruleID, decl) === MISRATransformationType.NoChange) {
                continue;
            }

            const filesWithInitialization = Query.search(FileJp, (fileJp) => {
              return fileJp.descendants.some((jp) => 
                isSameVarDecl(jp, decl) && (jp as Vardecl).init !== undefined
              );
            }).get();

            if (filesWithInitialization.length > 1) {
                
                const other = this.invalidDecls.filter(identifier => isSameVarDecl(identifier, decl));
                for (const varDecl of other) {
                    this.logMISRAError(varDecl, `Identifier '${getIdentifierName(varDecl)}' with external linkage is defined in multiple files`);
                    this.context.addRuleResult(this.ruleID, varDecl, MISRATransformationType.NoChange);
                }
            } 
            else if (filesWithInitialization.length === 0) {
                const other = this.invalidDecls.filter(identifier => isSameVarDecl(decl, identifier));
                other.forEach(varDecl => {
                    varDecl.setStorageClass(StorageClass.EXTERN)
                });
                solved = true;
            }
            else {
                const externalLinkageVars = getExternalLinkageIdentifiers().filter((identifierJp) => identifierJp instanceof Vardecl);
                const other = externalLinkageVars.filter(identifierJp => 
                    isSameVarDecl(decl, identifierJp) && 
                    (identifierJp.getAncestor("file").ast !== filesWithInitialization[0].ast)
                ); 
                other.forEach(varDecl => varDecl.setStorageClass(StorageClass.EXTERN));
                solved = true;
            } 
        }
        if (solved) {
            resetCaches();
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        }
        return new MISRATransformationReport(MISRATransformationType.NoChange);
    }
}
