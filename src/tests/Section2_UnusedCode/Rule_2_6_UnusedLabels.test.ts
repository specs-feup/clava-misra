import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
    static int test1() {
        int x = 0;
        goto label1;

        label1: 
            x++;

        return 0;
    }`;

const failingCode = `
    static int test2() {
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

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
