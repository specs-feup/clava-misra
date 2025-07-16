import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>

static int32_t count_5_9; /* "count" has internal linkage */

static void foo_5_9 (void) { 
    int16_t count_5_9; // Violation of rule 5.9
    int16_t index_5_9; 
}

void bar1 (void) {
    static int16_t count_5_9;  // Violation of rule 5.9
    foo_5_9();
}
`;

const failingCode2 = `
#include <stdint.h>

static int8_t count_5_9; // Violation of rule 5.9

static void foo_5_9 ( void ) { // Violation of rule 5.9
    int32_t index_5_9;
    int16_t nbytes; 
}

// Missing "static" keyword
void bar2 ( void ){
    static uint8_t nbytes; 
}
`;

const failingCode3 = `
#include <stdint.h>

static void test_5_9_1 ( void ) { 
    int32_t index_5_9 = 0;

    count_5_9: // Violation of rule 5.9
        index_5_9++;
    if (index_5_9 < 5) {
        goto count_5_9;
    }
}
`;

const systemFile = `
extern void bar1 (void);
extern void bar2 (void);
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "rule_5_9_system.c", code: systemFile}
];

describe("Rule 5.9", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(5);
        expect(countMISRAErrors("5.9")).toBe(5);

        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(5);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(3);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad3.c"}).first()!)).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
