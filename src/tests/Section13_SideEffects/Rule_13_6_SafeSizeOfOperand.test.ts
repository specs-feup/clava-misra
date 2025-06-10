import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
#include <stdint.h>
#include <stdio.h>

static void test13_6_1(int32_t n1) {
    size_t s1;
    volatile int32_t i1;
    int32_t j1; 

    s1 = sizeof(j1);                /* Compliant */
    s1 = sizeof(i1);                /* Compliant - exception */
    s1 = sizeof(int32_t);           /* Compliant */
    s1 = sizeof ( int32_t[ n1 ] );   /* Compliant */
}`;

const failingCode = 
`
#include <stdint.h>
#include <stdio.h>

// Missing static keyword
volatile uint32_t v;

static void test13_6_2(int32_t n) {
    int32_t j;
    size_t s;
    
    s = sizeof(j++);                    /* Non-compliant */
    s = sizeof(j += 8);                 /* Non-compliant */

    // Declaration of variable-length array type; will not be corrected
    s = sizeof ( int32_t[ n++ ] );      /* Non-compliant */
    s = sizeof ( int32_t[ v ] );       /* Non-compliant (access to volatile variable)*/
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.2", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(5);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(5);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(2);
    });
});
