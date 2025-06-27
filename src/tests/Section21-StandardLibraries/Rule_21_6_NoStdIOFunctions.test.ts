import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdio.h>

int main() {
    char buffer[100];

    // Non-compliant: call to stdlib function
    // Non-compliant: return value is not being used
    printf("Enter input: ");

    // Non-compliant: call to stdlib function
    // Non-compliant: return value is not being used
    fgets(buffer, sizeof(buffer), stdin);
    return 0;
}
`;

const customStdIO = `
// Missing "static" keyword; Will have external decl after correction
void my_printf(const char* fmt, ...) {
    (void)fmt;
}

// Missing "static" keyword; Will have external decl after correction
char* my_fgets(char* str, int num, void* stream) {
    (void)str;
    (void)num;
    (void)stream;
    return 0;
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "custom_stdio.c", code: customStdIO }
];

describe("Rule 21.6", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors("21.6")).toBeGreaterThanOrEqual(2);
    });
});
