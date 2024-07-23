import Query from "lara-js/api/weaver/Query.js";
import { FunctionJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { foo } from "./foo.js";
import S15_ControlFlowPass from "./misra/passes/S15_ControlFlowPass.js";
import MISRAReporter from "./misra/MISRAReporter.js";
import S10_EssentialTypePass from "./misra/passes/S10_EssentialTypePass.js";
import AggregatePassResult from "lara-js/api/lara/pass/results/AggregatePassResult.js";
import MISRAPassResult from "./misra/MISRAPassResult.js";

const pass = new S10_EssentialTypePass(false, [6]);
const reporter = new MISRAReporter();

Query.root().descendants.forEach($jp => {
    const result = reporter.applyPass(pass, $jp as Joinpoint) as AggregatePassResult;
    console.log(result);
});