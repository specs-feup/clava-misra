import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 
import Clava from "@specs-feup/clava/api/clava/Clava.js";

const passingCode = `
static int test_17_6_1(int my_array[]) {
    return my_array[0];  
}
`;

const failingCode = `
static int test_17_6_2(int my_array[static 10]) { // Violation of rule 17.7
    return my_array[0];  
}
`;

const misraExample = `
#include <stdint.h>

static uint16_t total_17_7 (uint16_t n, uint16_t a [static 20]) { // Violation of rule 17.6
    uint16_t i;
    uint16_t sum = 0U;

    /* Undefined behaviour if a has fewer than 20 elements */
    for (i = 0U; i < n; ++i){
        sum = sum + a[ i ];
    }
    return sum;
 }

static void g_17_7 (void) { 
    uint16_t x;
    uint16_t v1[10];
    uint16_t v2[ 20 ];

    x = total(10U, v1);
    x = total(20U, v2);
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode },
    { name: "misraExample.c", code: misraExample}
];

describe("Rule 17.6", () => { 
    if (Clava.getStandard() === "c90")  {
        it("should skip tests for c90", () => {});
    } else {
        registerSourceCode(files);

        it("should detect errors in bad.c", () => {
            expect(countMISRAErrors()).toBe(2); 
            expect(countMISRAErrors(Query.search(FileJp, { name: "misraExample.c" }).first()!)).toBe(1);
            expect(countMISRAErrors(Query.search(FileJp, { name: "bad.c" }).first()!)).toBe(1);
            expect(countMISRAErrors(Query.search(FileJp, { name: "good.c" }).first()!)).toBe(0);
        });

        it("should correct errors in bad.c", () => {
            expect(countErrorsAfterCorrection()).toBe(0);
        });
    }
});
