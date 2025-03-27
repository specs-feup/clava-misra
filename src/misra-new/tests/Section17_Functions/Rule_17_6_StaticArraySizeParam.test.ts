import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 

const passingCode = `
int test_17_6_1(int my_array[]) {
    return my_array[0];  
}`;

const failingCode = `
int test_17_6_2(int my_array[static 10]) {
    return my_array[0];  
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 17.6", () => { 
    if (process.env.STD_VERSION === "c90")  {
        it("should skip tests for c90", () => {});
    } else {
        registerSourceCode(files);

        it("should detect errors in bad.c", () => {
            expect(countMISRAErrors()).toBe(1); 
            expect(countMISRAErrors(Query.search(FileJp, { name: "bad.c" }).first()!)).toBe(1);
            expect(countMISRAErrors(Query.search(FileJp, { name: "good.c" }).first()!)).toBe(0);
        });

        it("should correct errors in bad.c", () => {
            expect(countErrorsAfterCorrection()).toBe(0);
        });
    }
});
