import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
#include <math.h>

static unsigned int func() {
    return 0;
}

void test_17_3_1() {
    double result = sqrt(func());
}
`;

const failingCode2 = `
#include <math.h>

static unsigned int func2() {
    double a = 2.0, b = 3.0;

    double pow_result = pow(a, b); 
    double sum = half(b) + pow_result;  // Implicit call to 'half': provided math.h does not solve

    // Implicit call: provided <ctype.h> does not solve
    char lower1 = 'a';
    char upper1 = toupper_transformation(lower1);

    return 0;
}
`;

// Missing externs
const failingCode3 = `
static unsigned int test_17_3_3() {
    int x = func(); // Implicit call to func() in good.c but does not have external linkage

    // Implicit call to func2() in bad2.c; Provided file in config does not include definition
    int y = func2(); 

    // Implicit call with wrong params
    (void) test_17_3_1(1, 4);
    return 0;
}
`;

const files: TestFile[] = [
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
];

describe("Rule 17.3 (without config)", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(6);  
        expect(countMISRAErrors("17.3")).toBe(5); 

    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(5);
    });
});