import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 
import path from "path";
import { fileURLToPath } from "url";

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

     typedef enum {
        SMALL,
        LARGE
    } Size;

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
        Config file specifies an invalid default value for 'Size' type (e.g: MEDIUM)
    */
    static Size test_17_4_7() {

    }

    /* 
        Non-compliant after correction: 
        Config file do not specify the default value for 'double' type
    */
    static double test_17_4_8() { 
    
    }
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
];

describe("Rule 17.4", () => {
    const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const configFilename = "misra_config.json";
        const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(7);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad1.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad2.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad3.c" }).first()!)).toBe(5);
        expect(countMISRAErrors(Query.search(FileJp, { name: "good.c" }).first()!)).toBe(0);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(2);
    });
});
