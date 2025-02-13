import MISRAReporter from "../MISRAReporter.js";
import S6_TypePass from "../passes/S6_TypePass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `struct good {
    int a:4;
    int:1;
    unsigned int b:8;
};`;

const failingCode = `struct good {
    int a:4;
    int c:1;
    unsigned int b:8;
};`;

const files: TestFile[] = [
    {name: "bad.c", code: failingCode},
    {name: "good.c", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S6_TypePass(true, [2]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 1, Query.search(FileJp, {name: "bad.c"}).first() as Joinpoint);
    });
});