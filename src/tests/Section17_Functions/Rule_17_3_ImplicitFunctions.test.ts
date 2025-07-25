import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
#include <math.h>
extern double test_17_3_4();

// Missing "static" keyword; Will have external decl after correction
unsigned int foo_17_3() {
    return 0;
}

// Missing "static" keyword; Will have external decl after correction
double test_17_3_1() {
    return sqrt(foo_17_3()) + test_17_3_4();
}
`;

const passingCode2 = `
extern int foo_17_3();
extern double test_17_3_1();

double test_17_3_4() {
    return foo_17_3() + test_17_3_1();
}
`;

const failingCode = `
static void test_17_3_2() {
    double a = 2.0, b = 3.0;

    // Implicit call to pow(): <math.h> is missing
    double res1 = pow(a, b); // Violation of rule 17.3
    double res2 = pow(b, a); // Violation of rule 17.3

    // Implicit call to toupper: <ctype.h> is missing
    char lower1 = 'a';
    char upper1 = toupper(lower1); // Violation of rule 17.3
    
    // Implicit call to sin(): <math.h> is missing
    double angle = 3.14159265; 
    double sin_val = sin(angle); // Violation of rule 17.3

    // Implicit call to strlen(): <ctype.h> is missing
    char lower2 = 'b';
    char upper2 = toupper(lower2);  // Violation of rule 17.3
}
`;

const failingCode2 = `
#include <math.h>

static unsigned int bar_17_3() {
    double a = 2.0, b = 3.0;

    double pow_result = pow(a, b); 

    // Implicit call: <string.h> is missing
    char lower1 = 'a';
    char upper1 = toupper(lower1); // Violation of rule 17.3

    return 0;
}
`;

// Missing externs
const failingCode3 = `
static unsigned int test_17_3_3() {
    int x = foo_17_3(); // Implicit call to foo_17_3() in good.c - violation of rule 17.3

    (void) test_17_3_1(); // Implicit call with wrong params - violation of rule 17.3
    return 0;
}
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
    { name: "good2.c", code:passingCode2 }
];

describe("Rule 17.3", () => {
    if (Clava.getStandard() !== "c90")  {
            it("should skip tests for c99 and c11", () => {});
    } else { 
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const configFilename = "misra_config.json";
        const configFilePath = path.join(__dirname, configFilename);

        registerSourceCode(files, configFilePath);

        it("should detect errors", () => {
            expect(countMISRAErrors()).toBe(8);  
            expect(countMISRAErrors("17.3")).toBe(8); 
        });

        it("should correct errors", () => {
            expect(countErrorsAfterCorrection()).toBe(0);
        });
    }
});