import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
#include <math.h>
extern double test_17_3_4();

// Missing "static" keyword; Will have external decl after correction
unsigned int func() {
    return 0;
}

// Missing "static" keyword; Will have external decl after correction
double test_17_3_1() {
    return sqrt(func()) + test_17_3_4();
}
`;

const passingCode2 = `
double test_17_3_4() {
    return 0.0;
}
`;

const failingCode = `
static void test_17_3_2() {
    double a = 2.0, b = 3.0;

    // Implicit call to pow(): <math.h> is missing
    double res1 = pow(a, b); 
    double res2 = pow(b, a);

    // Implicit call to strlen: <ctype.h> is missing
    char lower1 = 'a';
    char upper1 = toupper(lower1); 
    
    // Implicit call to sin(): <math.h> is missing
    double angle = 3.14159265; 
    double sin_val = sin(angle);

    // Implicit call to strlen(): <ctype.h> is missing
    char lower2 = 'b';
    char upper2 = toupper(lower2); 
}`;

const failingCode2 = `
#include <math.h>


static unsigned int func2() {
    double a = 2.0, b = 3.0;

    double pow_result = pow(a, b); 

    // Implicit call: <string.h> is missing
    char lower1 = 'a';
    char upper1 = toupper(lower1);

    return 0;
}`;

// Missing externs
const failingCode3 = `
static unsigned int test_17_3_3() {
    int x = func(); // Implicit call to func() in good.c

    // Implicit call with wrong params
    (void) test_17_3_1();
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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(10);  
        expect(countMISRAErrors("17.3")).toBe(8); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});