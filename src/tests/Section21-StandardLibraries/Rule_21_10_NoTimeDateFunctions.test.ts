import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <time.h>

static int test_21_10_1() {
    time_t now = time(0);
    clock_t start = clock();
    return 0;
}
`;

const customTimeLib = `
#include <time.h>

time_t my_time(void* arg) {
    (void)arg;
    return 0;
}

clock_t my_clock(void) {
    return 0;
}
`;

const systemFile = `
#include <time.h>
#include <stddef.h>

extern time_t my_time(void* arg);
extern clock_t my_clock(void);

static void use_externs_21_10() {
    (void) my_clock();
    (void) my_time(NULL);
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
        expect(countMISRAErrors()).toBe(2);
        expect(countMISRAErrors("21.10")).toBe(2);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
