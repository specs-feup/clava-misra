import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
static unsigned int test_17_4_1() {
    return 0;  
}

static unsigned int test_17_4_11(int w) {
    if (w > 20) {
        return 0;
    } else {
        return 1;
    }
}

static unsigned int test_17_4_12(int w) {
    if (w > 0) {
        if (w < 5) {
            return 4;
        } else {
            return 5;
        }
    } else {
        if (w == 0) {
            return 0;
        } else {
            return 0;
        }
    }
}
`;

const failingCode = `
static unsigned int test_17_4_2() { // Violation of rule 17.4

}
`;

const failingCode2 = `
static float test_17_4_3() { // Violation of rule 17.4

}
`;

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

static enum Status test_17_4_4() { // Violation of rule 17.4

}

static Color test_17_4_5() { // Violation of rule 17.4

}

static my_int_type test_17_4_6() { // Violation of rule 17.4

}

/* 
    Non-compliant after correction:
    Config file specifies an invalid default value for 'Size' type (e.g: MEDIUM)
*/
static Size test_17_4_7() { // Violation of rule 17.4

}

/* 
    Non-compliant after correction: 
    Config file do not specify the default value for 'double' type
*/
static double test_17_4_8() { // Violation of rule 17.4

}

static unsigned int test_17_4_13(int w) { // Violation of rule 17.4
    if (w > 0) {
        if (w < 5) {
            return 4;
        } else {
            return 5;
        }
    } else {
        if (w == 0) {
            return 0;
        }
    }
}
`;

const misraExample = `
#include <stdint.h>
#define V_MIN 1U
#define V_MAX 4U

static int absolute (int32_t v) {  // Violation of rule 17.4
    if (v < 0) {
        return v;
    }
  
}
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
    { name: "misraExample.c", code: misraExample },
];

describe("Rule 17.4", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(9);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad1.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad2.c" }).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, { name: "bad3.c" }).first()!)).toBe(6);
        expect(countMISRAErrors(Query.search(FileJp, { name: "good.c" }).first()!)).toBe(0);
        expect(countMISRAErrors(Query.search(FileJp, { name: "misraExample.c" }).first()!)).toBe(1);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(2);
    });
});
