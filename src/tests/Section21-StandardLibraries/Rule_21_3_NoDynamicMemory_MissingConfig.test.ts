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


const files: TestFile[] = [
    { name: "bad1.c", code: failingCode }
];

describe("Rule 21.3", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(5);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(5);
    });
});
