import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdlib.h>

static int test_21_8_1() {
    abort(); // Violation of rule 21.8
    exit(1);  // Violation of rule 21.8
    return 0;
}
`;

// Custom implementations that will be used for correction
const customStdLib = `
#include <stddef.h>

void my_abort(void) {
    // safe replacement
}

void my_exit(int status) {
    (void)status;
    // safe replacement
}
`;

const systemFile = `
extern void my_abort(void);
extern void my_exit(int status);
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "custom_stdlib.c", code: customStdLib },
    { name: "rule_21_8_system.c", code: systemFile }
];

describe("Rule 21.8", () => {
    if (Clava.getStandard() === "c11")  {
        it("should skip tests for c11", () => {});
    } else {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const configFilePath = path.join(__dirname, "misra_config.json");

        registerSourceCode(files, configFilePath);

        it("should detect errors", () => {
            expect(countMISRAErrors()).toBe(2); 
            expect(countMISRAErrors("21.8")).toBe(2); 
        });

        it("should correct errors", () => {
            expect(countErrorsAfterCorrection()).toBe(0);
        });
    }
});
