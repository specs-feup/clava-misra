import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const passingCode = `
#include <stdio.h>
int func() {
    return 0;
}

void test_17_3_1() {
    printf("Result: %.2f ", func());
}`;

const failingCode = `
void test_17_3_2() {
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

int func() {
    double a = 2.0, b = 3.0;

    double pow_result = pow(a, b); 
    double sum = half(b) + pow_result;  // Implicit call: provided math.h does not solve

    // Implicit call: provided stdio.h does not solve the issue
    // Return value is not being used
    println("Result: ", sum);

    return 0;
}`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "bad2.c", code: failingCode2 },
    { name: "good.c", code: passingCode },
];

describe("Rule 17.4", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(12);
    });

    it("should correct errors", () => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const configFilename = "misra_config.json";
        const configFilePath = path.join(__dirname, configFilename);

        expect(countErrorsAfterCorrection(configFilePath)).toBe(3);
    });
});
