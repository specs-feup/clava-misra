import Query from "lara-js/api/weaver/Query.js";
import { FunctionJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { foo } from "./foo.js";
import S16_SwitchStatementPass from "./misra/passes/S16_SwitchStatementPass.js";
import S15_ControlFlowPass from "./misra/passes/S15_ControlFlowPass.js";
import MISRAReporter from "./misra/MISRAReporter.js";
import S10_EssentialTypePass from "./misra/passes/S10_EssentialTypePass.js";
import AggregatePassResult from "lara-js/api/lara/pass/results/AggregatePassResult.js";
import MISRAPassResult from "./misra/MISRAPassResult.js";
import S12_ExpressionPass from "./misra/passes/S12_ExpressionPass.js";
import S17_FunctionPass from "./misra/passes/S17_FunctionPass.js";

const pass = new S17_FunctionPass(true, [1,7]);
const reporter = new MISRAReporter();

console.log(Query.root().dump);

const result = reporter.applyPass(pass, Query.root() as Joinpoint) as AggregatePassResult;
if (result) {
    result.results.forEach(res => {
        const reports = (res as MISRAPassResult).reports;
        console.log(reports);
        reports.forEach(rep => rep.fix?.execute());
    });
}