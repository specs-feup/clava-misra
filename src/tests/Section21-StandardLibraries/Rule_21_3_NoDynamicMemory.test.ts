import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdlib.h>

static int test_21_3_1() {
    int *a = calloc(1, sizeof(int)); // Violation of rule 21.3
    int *b = malloc(sizeof(int)); // Violation of rule 21.3
    a = realloc(a, 2 * sizeof(int)); // Violation of rule 21.3
    free(a); // Violation of rule 21.3
    free(b); // Violation of rule 21.3
    return 0;
}
`;

const customStdLib = `
#include <stddef.h>

void* my_malloc(size_t size) {
    (void)size;
    return NULL;
}

void* my_calloc(size_t num, size_t size) {
    (void)num;
    (void)size;
    return NULL;
}

void* my_realloc(void* ptr, size_t size) {
    (void)ptr;
    (void)size;
    return NULL;
}

void my_free(void* ptr) {
    (void)ptr;
}
`;

const systemFile = `
#include <stddef.h>

extern void* my_malloc(size_t size);
extern void* my_calloc(size_t num, size_t size);
extern void* my_realloc(void* ptr, size_t size);
extern void my_free(void* ptr);
`;


const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "custom_stdlib.c", code: customStdLib },
    { name: "rule_21_3_system.c", code: systemFile }
];

describe("Rule 21.3", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(5);  
        expect(countMISRAErrors("21.3")).toBe(5); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
