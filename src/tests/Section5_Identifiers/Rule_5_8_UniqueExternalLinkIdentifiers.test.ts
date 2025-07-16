import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const file1 = `
#include <stdint.h>

int32_t count_5_8; 

void foo_5_8 ( void ) { // Violation of rule 5.9
    int16_t index_5_8; 
}
`;

const file2 = `
#include <stdint.h>

static void foo_5_8 ( void ) {  // Violation of rule 5.8
    int16_t count_5_8; // Violation of rule 5.8
    int32_t index_5_8; 
}
`;

const file3 = `
#include <stdint.h>

static void test_5_8_1 ( void ) { 
    int32_t index_5_8 = 0;

    count_5_8: // Violation of rule 5.8
        index_5_8++;
    if (index_5_8 < 5) {
        goto count_5_8;
    }
}

static void test_5_8_2(void) {  
    int32_t foo_5_8 = 0; // Violation of rules 5.8 and 5.9
}
`;

const systemFile = `
#include <stdint.h>
extern int32_t count_5_8;
extern void foo_5_8 (void);
`;

const files: TestFile[] = [
    { name: "file1.c", code: file1 },
    { name: "file2.c", code: file2 },
    { name: "file3.c", code: file3 },
    { name: "rule_5_8_system.c", code: systemFile}
];

describe("Rule 5.8", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(6);
        expect(countMISRAErrors("5.8")).toBe(4);

        //expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!, "5.8")).toBe(0);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!, "5.8")).toBe(2);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!, "5.8")).toBe(3);
    });

    it("should correct errors in bad.c", () => {
         expect(countErrorsAfterCorrection()).toBe(0);
    });
});
