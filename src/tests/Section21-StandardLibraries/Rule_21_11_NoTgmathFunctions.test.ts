import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const badCode = `
#include <tgmath.h>   /* Non-compliant */

static void test_21_11_1(void) {
    float f1, f2;
    f1 = sqrt(f2); // Non-compliant
}
`;

const passingCode = `
#include <math.h>

static void test_21_11_2(void) {
    float f1, f2;
    f1 = sqrtf(f2); // Compliant
}
`;

const customMath = `
float my_sqrt(float x) {
    (void)x;
    return 0.0;
}
`;

const systemFile = `
extern float my_sqrt(float x);

static void use_externs_21_11() {
    (void)my_sqrt(20.0);
}
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files: TestFile[] = [
    { name: "bad.c", code: badCode },
    { name: "good.c", code: passingCode },
    { name: "custom_math.c", code: customMath },
    { name: "rule_21_11_system.c", code: systemFile }
];

describe("Rule 21.11", () => {
    if (Clava.getStandard() === "c90")  {
        it("should skip tests for c90", () => {});
    } else {
        const configFilename = "misra_config.json";
        const configFilePath = path.join(__dirname, configFilename);

        registerSourceCode(files, configFilePath);

        it("should detect errors", () => {
            expect(countMISRAErrors()).toBe(2);
            expect(countMISRAErrors("21.11")).toBe(2);
        });

        it("should correct errors", () => {
            expect(countErrorsAfterCorrection()).toBe(2);
        });
    }
});
