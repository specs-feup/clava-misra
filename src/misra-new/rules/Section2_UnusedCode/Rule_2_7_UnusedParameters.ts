import { FunctionJp, Joinpoint, Param, Varref, Call } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

export default class Rule_2_7_UnusedParameters extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.7", context);
    }

    private getUnusedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => {
            try {
                return Query.searchFrom(func, Varref, { 
                    decl: jp => jp?.astId === param.astId 
                }).get().length === 0;
            } catch (error) {
                return false; 
            }
        });
    }    

    private getUsedParams(func: FunctionJp): Param[] {
        return func.params.filter(param => {
            try {
                return Query.searchFrom(func, Varref, { 
                    decl: jp => jp?.astId === param.astId 
                }).get().length > 0;
            } catch (error) {
                return false; 
            }
        });
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

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp && $jp.isImplementation)) return false;

        const unusedParams = this.getUnusedParams($jp);
        if (logErrors) {
            unusedParams.forEach(param => 
                this.logMISRAError(param, `Parameter ${param.name} is unused in function ${$jp.name}.`)
            )
        }
        return unusedParams.length > 0;
    }
    
    transform($jp: Joinpoint): MISRATransformationReport {
        if(!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const usedParams = this.getUsedParams($jp as FunctionJp);
        const usedParamsPositions = this.getUsedParamsPositions($jp as FunctionJp);
        const calls = Query.search(Call, {function: jp => jp.astId === $jp.astId}).get();
        
        ($jp as FunctionJp).setParams(usedParams);
        for (const funcDecl of ($jp as FunctionJp).declarationJps) {
            funcDecl.setParams(usedParams);
        }

        for (const call of calls) {
            const newArgs = usedParamsPositions.map(i => call.args[i]);
            const newCall = ($jp as FunctionJp).newCall(newArgs)
            call.replaceWith(newCall);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
