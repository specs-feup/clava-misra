import MISRAReporter from "../MISRAReporter.js";
import S12_ExpressionPass from "../passes/S12_ExpressionPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `int main(int argc, char *argv[]) {
    int x, y, z;
   x = 2;
   y = 3;

   x = x + (y * z);

    return 0;
}`;

const failingCode = `int test(int argc, char *argv[]) {
    int x, y, z;
   x = 2, y = 3;

   x = x + y * z;

    return 0;
}`;

const files: TestFile[] = [
    {name: "bad.c", code: failingCode},
    {name: "good.c", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S12_ExpressionPass(true, [1, 3]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 2, Query.search(FileJp, {name: "bad.c"}).first() as Joinpoint);
    });
});