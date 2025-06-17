import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const compliantCode = `
#include <stdint.h>

int32_t count; /* "count" has external linkage */

void foo ( void ){ /* "foo" has external linkage */
    int16_t index; /* "index" has no linkage */
}
`;

const failingCode1 = `
#include <stdint.h>

/*
* Non-compliant - "foo" is already defined 
* with external linkage in other file 
*/
static void foo ( void ) { 
    int16_t count; // Non-compliant: "count" has external linkage in other file
    int32_t index; 
}
`;

const failingCode2 = `
#include <stdint.h>

static void test_5_8_1 ( void ) { 
    int32_t index = 0;

    count: // Non-compliant: "count" has external linkage in other file
        index++;
    if (index < 5) {
        goto count;
    }
}

static void count(void) {  // Non-compliant: "count" has external linkage in other file
    int32_t foo = 0; // Non-compliant: "foo" has external linkage in other file
}
`;

const files: TestFile[] = [
    { name: "good.c", code: compliantCode },
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 }
];

describe("Rule 5.8", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors("5.8")).toBe(5);

        //expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!, "5.8")).toBe(0);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!, "5.8")).toBe(2);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!, "5.8")).toBe(3);
    });

    it("should correct errors in bad.c", () => {
         expect(countErrorsAfterCorrection()).toBe(0);
    });
});
