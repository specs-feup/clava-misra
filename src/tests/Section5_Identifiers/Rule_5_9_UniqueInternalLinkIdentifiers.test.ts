import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>

static int32_t count; /* "count" has internal linkage */

static void foo ( void ) { 
    int16_t count; // Non-compliant: clashes with internal linkage variable "count"
    int16_t index; 
}

// Missing "static" keyword
void bar1 ( void ) {
    /* Non-compliant - clashes with internal linkage identifier "count" */
    static int16_t count; 
    foo();
}
`;

const failingCode2 = `
#include <stdint.h>

/* 
* Non-compliant - "count" has internal linkage but clashes 
* with other internal linkage identifier with the same name 
*/
static int8_t count; 

static void foo ( void ) { /* Non-compliant - "foo" has internal
 * linkage but clashes with a function of the same name */

    int32_t index;
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
    int32_t index = 0;

    count: // Non-compliant: label name "count" has internal linkage in other file
        index++;
    if (index < 5) {
        goto count;
    }
}
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 }
];

describe("Rule 5.9", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(7);

        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(5);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(3);
        //expect(countMISRAErrors(Query.search(FileJp, {name: "bad3.c"}).first()!)).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
