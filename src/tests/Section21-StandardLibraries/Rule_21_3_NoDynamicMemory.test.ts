import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdlib.h>

int main() {
    int *a = calloc(1, sizeof(int));
    int *b = malloc(sizeof(int));
    a = realloc(a, 2 * sizeof(int));
    free(a);
    free(b);
    return 0;
}
`;

const customStdLib = `
#include <stddef.h>

// Missing "static" keyword; Will have external decl after correction
void* my_malloc(size_t size) {
    (void)size;
    return NULL;
}

// Missing "static" keyword; Will have external decl after correction
void* my_calloc(size_t num, size_t size) {
    (void)num;
    (void)size;
    return NULL;
}

// Missing "static" keyword; Will have external decl after correction
void* my_realloc(void* ptr, size_t size) {
    (void)ptr;
    (void)size;
    return NULL;
}

// Missing "static" keyword; Will have external decl after correction
void my_free(void* ptr) {
    (void)ptr;
}
`;


const files: TestFile[] = [
    { name: "bad1.c", code: failingCode },
    { name: "custom_stdlib.c", code: customStdLib }
];

describe("Rule 21.3", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(9);  
        expect(countMISRAErrors("21.3")).toBe(5); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
