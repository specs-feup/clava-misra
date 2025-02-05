import MISRAReporter from "../MISRAReporter.js";
import S17_FunctionPass from "../passes/S17_FunctionPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `int g() {
    return 5;
}

int main(int argc, char *argv[]) {
    (void)g();

    return 0;
}`;

const failingCode = `#include <stdarg.h>

int f() {
    return 5;
}

int test(int argc, char *argv[]) {
    f();

    return 0;
}`;

const files: TestFile[] = [
    {name: "bad.cpp", code: failingCode},
    {name: "good.cpp", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S17_FunctionPass(true, [1, 7]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 2, Query.search(FileJp, {name: "bad.cpp"}).first() as Joinpoint);
    });
});