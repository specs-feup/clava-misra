import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <time.h>

int main() {
    time_t now = time(0);
    clock_t start = clock();
    return 0;
}
`;

const customTimeLib = `
// Dummy replacements for time and clock
typedef long time_t;
typedef unsigned long clock_t;

// Missing "static" keyword; Will have external decl after correction
time_t my_time(void* arg) {
    (void)arg;
    return 0;
}

// Missing "static" keyword; Will have external decl after correction
clock_t my_clock(void) {
    return 0;
}
`;

const files: TestFile[] = [
    { name: "bad_time.c", code: failingCode },
    { name: "custom_time.c", code: customTimeLib }
];

describe("Rule 21.10", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(4);
        expect(countMISRAErrors("21.10")).toBe(2);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
