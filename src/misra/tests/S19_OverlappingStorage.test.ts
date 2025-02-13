import MISRAReporter from "../MISRAReporter.js";
import S19_OverlappingStoragePass from "../passes/S19_OverlappingStoragePass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `struct a {
    int a;
    int b;
};

int main(int argc, char *argv[]) {
    return 0;
}`;

const failingCode = `union a {
    int a;
    int b;
};`;

const files: TestFile[] = [
    {name: "bad.c", code: failingCode},
    {name: "good.c", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S19_OverlappingStoragePass(true, [2]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 1, Query.search(FileJp, {name: "bad.c"}).first() as Joinpoint);
    });
});