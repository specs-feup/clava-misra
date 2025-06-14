import { FunctionJp, Joinpoint, Param, Varref, Call, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getParamReferences } from "../../utils/FunctionUtils.js";

export default class Rule_2_7_UnusedParameters extends MISRARule {
    priority = 2; 

    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "2.7";
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;

        const functions = Query.search(FunctionJp, {isImplementation: true}).get();
        const nonCompliant = functions.some((funcJp) => funcJp.params.some((param) => getParamReferences(param, funcJp).length === 0));

        if (logErrors && nonCompliant) {
            for (const funcJp of functions) {
                const unusedParams = this.getUnusedParams(funcJp);

                unusedParams.forEach(param => 
                    this.logMISRAError(param, `Parameter '${param.name}' is unused in function ${funcJp.name}.`)
                )
            }
        } 
        return nonCompliant;
    }

    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const functions = Query.search(FunctionJp, {isImplementation: true}).get();
        for (const funcJp of functions) {

            const usedParams = this.getUsedParams(funcJp);
            if (usedParams.length === funcJp.params.length) { // All parameters are used
                continue;
            } 

            const usedParamsPositions = this.getUsedParamsPositions(funcJp);
            const calls = Query.search(Call, {function: jp => jp.astId === funcJp.astId}).get();
            
            funcJp.setParams(usedParams);

            for (const call of calls) {
                const newArgs = usedParamsPositions.map(i => call.args[i]);
                const newCall = funcJp.newCall(newArgs);
                call.replaceWith(newCall);
            }
        }
        ($jp as Program).rebuild();
        return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
    }

    private getUnusedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => getParamReferences(param, func).length === 0);
    }    

    private getUsedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => getParamReferences(param, func).length > 0);
    }

    private getUsedParamsPositions(func: FunctionJp): number[] {
        let result = [];
        for (let i = 0; i < func.params.length; i++) {
            const param = func.params[i];
            if (Query.searchFrom(func, Varref, { decl: jp => jp?.astId === param.astId }).get().length > 0) {
                result.push(i);
            }
        }
        return result;
    }
}
