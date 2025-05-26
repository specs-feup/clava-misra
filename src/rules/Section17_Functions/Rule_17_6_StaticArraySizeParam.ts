import { AdjustedType, ArrayType, FunctionJp, Joinpoint, Param } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getParamReferences } from "../../utils/FunctionUtils.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

/**
 * MISRA Rule 17.6: The declaration of an array parameter shall not contain the static keyword between the [ ]
 */
export default class Rule_17_6_StaticArraySizeParam extends MISRARule {
    #invalidParams: Param[] = [];
    
    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "17.6";
    }

    /**
     * Checks if the given joinpoint represents a function with any array parameter containing the 'static' keyword between the [ ].
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp) || Clava.getStandard() === "c90") return false;

        this.#invalidParams = $jp.params.filter(paramJp => paramJp.type instanceof AdjustedType &&
            paramJp.type.originalType instanceof ArrayType &&
            paramJp.type.originalType.arraySize !== -1 &&
            /\[\s*static\s+\d+\s*\]/.test(paramJp.code)
        );

        if (logErrors) {
            for (const invalidParam of this.#invalidParams) {
                this.logMISRAError(invalidParam, `The 'static' keyword cannot appear inside the square brackets ('[]') in array parameter declarations.`)
            }
        }
        return this.#invalidParams.length > 0;
    }

    /**
     * Transforms the joinpoint if it represents a function with any array parameter containing the 'static' keyword between the square brackets.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const invalidParam of this.#invalidParams) {
            const paramRefs = getParamReferences(invalidParam, $jp);

            // Replace the parameter with a new array parameter whose size is variant
            const originalType = (invalidParam.type as AdjustedType).originalType;
            const newJp = ClavaJoinPoints.param(
                invalidParam.name, 
                ClavaJoinPoints.incompleteArrayType((originalType as ArrayType).elementType)
            );            
            const newParam = invalidParam.replaceWith(newJp) as Param;

            // Replace all references to the invalid parameter with the new one
            for (const ref of paramRefs) {
                ref.replaceWith(newParam.varref());
            }
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
