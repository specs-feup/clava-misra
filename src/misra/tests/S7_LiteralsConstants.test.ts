import MISRAReporter from "../MISRAReporter.js";
import S7_LiteralsConstantsPass from "../passes/S7_LiteralsConstantsPass.js";
import Query from "lara-js/api/weaver/Query.js";
import { FileJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `void bar(const char* s) {
   return;
}

const char* foo() {
   const char* s = "hello world";
   int a = 12;
   long b = 42L;
   bar("bad call");
   return "bye world";
}`;
 
 const failingCode = `void bar(char* s) {
   return;
}

char* foo() {
   char* s = "hello world";
   int a = 014;
   long b = 42l;
   bar("bad call");
   return "bye world";
}`;

const files: TestFile[] = [
    {name: "bad.cpp", code: failingCode},
    {name: "good.cpp", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S7_LiteralsConstantsPass(true, [1, 3, 4]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 5, Query.search(FileJp, {name: "bad.cpp"}).first() as Joinpoint);
    });
});