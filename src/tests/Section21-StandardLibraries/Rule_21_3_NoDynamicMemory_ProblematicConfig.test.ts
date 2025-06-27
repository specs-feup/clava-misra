import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode = `
#include <stdlib.h>

int main() {

    // Provided fix has internal linkage
    int *a = calloc(1, sizeof(int));

    // Provided fix has different num of parameters
    int *b = malloc(sizeof(int)); 

    // Provided file does not include provided function name
    a = realloc(a, 2 * sizeof(int));

    // Config has missing parameters
    free(a);
    free(b);
    return 0;
}
`;

const customStdLib = `
#include <stddef.h>

static void* my_calloc(size_t num, size_t size) {
    (void)num;
    (void)size;
    return NULL;
}

// Missing "static" keyword; Will have external decl after correction
void* my_malloc(size_t num, size_t size) {
    (void)num;
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

    const configFilename = "problematic_misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(7);  
        expect(countMISRAErrors("21.3")).toBe(5); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(5);
    });
});
