import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const bad = `
#include <stdlib.h>

static int compare(const void* a, const void* b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    int arr1[] = { 5, 3, 1, 4, 2 };
    int n1 = sizeof(arr1) / sizeof(arr1[0]);
    qsort(arr1, n1, sizeof(int), compare); // Non-compliant

    int arr2[] = { 1, 2, 3, 4, 5 };
    int key = 3;
    int n2 = sizeof(arr2) / sizeof(arr2[0]);
    int* item = (int*)bsearch(&key, arr2, n2, sizeof(int), compare); // Non-compliant

    return 0;
}
`;

const customStdLib = `
#include <stddef.h>

// Missing "static" keyword; Will have external decl after correction
void my_qsort(void* base, size_t num, size_t size, int (*compar)(const void*, const void*)) {
    (void)base;
    (void)num;
    (void)size;
    (void)compar;
}

// Missing "static" keyword; Will have external decl after correction
void* my_bsearch(const void* key, const void* base, size_t num, size_t size, int (*compar)(const void*, const void*)) {
    (void)key;
    (void)base;
    (void)num;
    (void)size;
    (void)compar;
    return NULL;
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: bad },
    { name: "custom_stdlib.c", code: customStdLib }
];

describe("Rule 21.9", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(4);  
        expect(countMISRAErrors("21.9")).toBe(2); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
