import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <time.h>

static int test_21_10_1() {
    int start = clock(); /*  Violation of rule 21.10 */
    int execution_time = difftime(0, 5); /*  Violation of rule 21.10 */
    return 0;
}
`;

const customTimeLib = `
int my_difftime(int arg1, int arg2) {
    (void)arg1;
    (void)arg2;
    return 0;
}

int my_clock(void) {
    return 0;
}
`;

const systemFile = `
#include <stddef.h>

extern int my_difftime(int arg1, int arg2);
extern int my_clock(void);

static void use_externs_21_10() {
    (void) my_clock();
    (void) my_difftime(1, 0);
}
`;

const files: TestFile[] = [
    { name: "bad_time.c", code: failingCode },
    { name: "custom_time.c", code: customTimeLib },
    { name: "rule_21_10_system.c", code: systemFile }
];

describe("Rule 21.10", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(3);
        expect(countMISRAErrors("21.10")).toBe(3);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
