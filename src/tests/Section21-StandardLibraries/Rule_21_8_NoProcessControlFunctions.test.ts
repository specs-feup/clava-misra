import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdlib.h>

int main() {
    abort();
    exit(1);
    return 0;
}
`;

// Custom implementations that will be used for correction
const customStdLib = `
#include <stddef.h>

// Missing "static" keyword; Will have external decl after correction
void my_abort(void) {
    // safe replacement
}

// Missing "static" keyword; Will have external decl after correction
void my_exit(int status) {
    (void)status;
    // safe replacement
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "custom_stdlib.c", code: customStdLib }
];

describe("Rule 21.8", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const configFilePath = path.join(__dirname, "misra_config.json");

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(4); 
        expect(countMISRAErrors("21.8")).toBe(2); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
