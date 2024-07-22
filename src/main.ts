import Query from "lara-js/api/weaver/Query.js";
import { FunctionJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { foo } from "./foo.js";
import S15_ControlFlowPass from "./misra/passes/S15_ControlFlowPass.js";
import MISRAReporter from "./misra/MISRAReporter.js";

const pass = new S15_ControlFlowPass(false, [1,2,3,4]);
const reporter = new MISRAReporter();

Query.root().descendants.forEach($jp => {
    reporter.applyPass(pass, $jp as Joinpoint);
});