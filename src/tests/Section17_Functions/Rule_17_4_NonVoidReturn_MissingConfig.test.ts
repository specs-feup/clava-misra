import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 

const passingCode = `
static unsigned int test_17_4_1() {
    return 0;  
}`;

const failingCode = `
static unsigned int test_17_4_2() {

}`;

const failingCode2 = `
static float test_17_4_3() {

}`;

const failingCode3 = `
    enum Status { 
        FAIL, 
        SUCCESS
    };

    typedef enum {
        RED,
        GREEN, 
    } Color;

    typedef unsigned int my_int_type;

    // Non-compliant
    static enum Status test_17_4_4() {

    }

    // Non-compliant
    static Color test_17_4_5() {

    }

    // Non-compliant
    static my_int_type test_17_4_6() {
    
    }

    /* 
        Non-compliant after correction: 
        Config file do not specify the default value for 'double' type
    */
    static double test_17_4_7() { 
    }
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
];

describe("Rule 17.4 (without config)", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(6);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad1.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad2.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad3.c" }).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, { name: "good.c" }).first()!)).toBe(0);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(6);
    });
});
