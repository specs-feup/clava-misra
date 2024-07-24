import MISRAReporter from "../MISRAReporter.js";
import S3_CommentPass from "../passes/S3_CommentPass.js";
import Query from "lara-js/api/weaver/Query.js";
import { FileJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `int main(int argc, char *argv[]) {
    int x, y, z;//good inline comment
    //good comment
    return 0;
}`;

const failingCode = `int main(int argc, char *argv[]) {
    int x, y, z; //bad inl//ine comment
    //bad /*comment
    return 0;
}`;

const files: TestFile[] = [
    {name: "bad.cpp", code: failingCode},
    {name: "good.cpp", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S3_CommentPass(true, [3]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 2, Query.search(FileJp, {name: "bad.cpp"}).first() as Joinpoint);
    });
});