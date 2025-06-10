import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
#include <stdio.h>

// Missing static keyword as it is does not have external declaration
// It will have external decl after correction
int func() {
    return 0;
}

// Missing static keyword
// It will NOT have external decl after correction
void test_17_3_1() {
    printf("Result: %.2f ", func());
}`;

const failingCode = `
static void test_17_3_2() {
    double a = 2.0, b = 3.0;

    // Implicit call to pow(): math.h is missing
    double res1 = pow(a, b); 
    double res2 = pow(b, a);

    // Implicit call to printf(): studio.h is missing
    // Return value is not being used
    printf("Results: %.2f %.2f ", res1, res2);
    
    // Implicit call to sin(): math.h is missing
    double angle = 3.14159265; 
    double sin_val = sin(angle);

    // Implicit call to printf(): studio.h is missing
    // Return value is not being used
    printf("Sin: %.2f ", sin_val);

    // Implicit call to print(): studio.h will not solve this issue
    // Return value is not being used
    (void) print("End of program");

}`;

const failingCode2 = `
#include <math.h>

static int func2() {
    double a = 2.0, b = 3.0;

    double pow_result = pow(a, b); 
    double sum = half(b) + pow_result;  // Implicit call: provided math.h does not solve

    // Implicit call: provided stdio.h does not solve the issue
    // Return value is not being used
    println("Result: ", sum);

    return 0;
}`;

const failingCode3 = `
static int test_17_3_3() {
    int x = func(); // Implicit call to func() in good.c

    // Implicit call to func2() in bad2.c; Provided file in config does not include definition
    int y = func2(); 

    // Implicit call with wrong params
    // Return value is not being used
    test_17_3_1(1, 4);
    return 0;
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
        expect(countMISRAErrors()).toBe(18);  
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(6);
    });
});
