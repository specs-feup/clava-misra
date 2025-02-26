import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = `int main(int argc, char *argv[]) {
    int x, y, z;// good inline comment
    // good */ comment
    return 0;
}`;

const failingCode = `int test(int argc, char *argv[]) {
    int x, y, z; // bad inl/*ine comment

    /* bad /* block comment */

    return 0;
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 3.1", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
