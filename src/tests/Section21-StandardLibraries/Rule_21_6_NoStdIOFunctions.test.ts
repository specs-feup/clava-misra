import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdio.h>  /* Non-compliant */

static void test_21_6_1() {
    char buffer[100];

    // Non-compliant: call to stdlib function
    (void) printf("Enter input: "); // Violation of rule 21.6
}
`;

const customStdIO = `
void my_printf(const char* fmt, ...) {
    (void)fmt;
}

char* my_fgets(char* str, int num, void* stream) {
    (void)str;
    (void)num;
    (void)stream;
    return 0;
}
`;

const systemFile = `
extern void my_printf(const char* fmt, ...);
extern char* my_fgets(char* str, int num, void* stream);

static void use_externs_21_6() {
    char buffer_21_6[10];
    my_printf("Done");
    (void) my_fgets(buffer_21_6, 10, 0);
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "custom_stdio.c", code: customStdIO },
    { name: "rule_21_6_system.c", code: systemFile }
];

describe("Rule 21.6", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(2);  
        expect(countMISRAErrors("21.6")).toBeGreaterThanOrEqual(2);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
