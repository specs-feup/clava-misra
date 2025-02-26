import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = `int test(int argc, char *argv[]) {
    int x = 0;
    goto label1;

    label1: 
        x++;

    return 0;
}`;

const failingCode = `
    int test(int argc, char *argv[]) {
        int x = 0;
        label1: 
            x = 1;
            label2:
                x++;

        goto label3;

        label3: 
            x += 4;
        return 0;
    }`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 2.6", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
