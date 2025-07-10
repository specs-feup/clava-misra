import { FunctionJp, Joinpoint, Param, Varref, Call, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getParamReferences } from "../../utils/FunctionUtils.js";
import { rebuildProgram } from "../../utils/ProgramUtils.js";

/**
 * MISRA-C Rule 2.7: There should be no unused parameters in functions.
 */
export default class Rule_2_7_UnusedParameters extends MISRARule {
    private unusedParams: Param[] = [];
    override get name(): string {
        return "2.7";
    }

    /**
     * Checks if the program contains function with unused parameters.
     * A parameter is considered unused if it is never referenced anywhere in the function.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp && $jp.isImplementation))
            return false;
        
        const nonCompliant = $jp.params.some((param) => getParamReferences(param, $jp).length === 0);
        if (logErrors && nonCompliant) {
            this.unusedParams = this.getUnusedParams($jp);
            this.unusedParams.forEach(param => this.logMISRAError(param, `Parameter '${param.name}' is unused in function ${$jp.name}.`));
        }
        return nonCompliant;
    }

    /**
     * Removes all unused parameters from functions in the program
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const funcJp = $jp as FunctionJp;
        const usedParams = this.getUsedParams(funcJp);
        const unusedParamsPosition = this.getUnusedParamsPositions(funcJp);
        const calls = Query.search(Call, {function: jp => jp.astId === funcJp.astId}).get();
        
        funcJp.setParams(usedParams);

        for (const call of calls) {
            const unusedArgs = unusedParamsPosition.map(i => call.args[i]);
            unusedArgs.forEach(arg => arg.detach());
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }

    /**
     * Gets all unused parameters from a function joinpoint
     * 
     * @param func - Function joinpoint to analyze
     * @returns Returns a list of all unused parameters from a function.
     */
    private getUnusedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => getParamReferences(param, func).length === 0);
    }    

    /**
     * Gets all used parameters from a function joinpoint
     * 
     * @param func - Function joinpoint to analyze
     * @returns Returns a list of parameters that are used within a function.
     */
    private getUsedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => getParamReferences(param, func).length > 0);
    }

    /**
     * Returns the positions (indexes) of parameters that are used in the given function joinpoint.
     *
     * @param func - Function joinpoint to analyze
     * @returns returns a list of numbers representing the indexes of used parameters.
     */
    private getUnusedParamsPositions(func: FunctionJp): number[] {
        let result = [];
        for (let i = 0; i < func.params.length; i++) {
            const param = func.params[i];
            const varRefs = Query.searchFrom(func, Varref, { decl: jp => jp?.astId === param.astId }).get();
            if (varRefs.length === 0) {
                result.push(i);
            }
        }
        return result;
    }
}
