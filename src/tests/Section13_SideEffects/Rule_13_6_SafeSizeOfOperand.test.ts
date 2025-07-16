import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const misraExample = `
#include <stdint.h>
#include <stddef.h>

static void test_13_6_1(void) {
    volatile int32_t i;
    int32_t j; 
    size_t s;

    s = sizeof(j);               
    s = sizeof(j++);             // Non-compliant (rule 13.6)
    s = sizeof(i);               
    s = sizeof(int32_t);         
}
static volatile uint32_t v; 

static void f(int32_t n) { 
    size_t s;
    s = sizeof(int32_t[n]);                            /* Compliant */
    s = sizeof(int32_t[n++]);                          /* Non-compliant (rule 13.6) */
}
`;

const passingCode = `
#include <stdint.h>
#include <stddef.h>

static void test_13_6_2(int32_t n1, int32_t buffer[]) {
    size_t s1;
    volatile int32_t i1;
    int32_t j1; 

    s1 = sizeof(j1);                /* Compliant */
    s1 = sizeof(i1);                /* Compliant - exception */
    s1 = sizeof(i1 + j1);           /* Compliant */
    s1 = sizeof(int32_t);           /* Compliant */
    s1 = sizeof( int32_t[ n1 ] );   /* Compliant */
    s1 = sizeof(buffer[s1]);        /* Compliant */
}
`;

const failingCode = `
#include <stdint.h>
#include <stddef.h>

static int32_t foo_13_6_3(float n) {
    if (n > 0) {
        return 1;
    }
    return -1;
}

static float bar_13_6_4() {
    return 5.0;
}

static void test_13_6_3(int32_t n) {
    uint32_t a2 = 0x0F;
    uint32_t b2 = 0x0A;
    int32_t i2;
    int32_t j2;
    size_t s2;
    
    s2 = sizeof(i2++);          // Non-compliant (rule 13.6) 
    s2 = sizeof(i2--);          // Non-compliant (rule 13.6)
    s2 = sizeof(++i2);          // Non-compliant (rule 13.6) 
    s2 = sizeof(i2--);          // Non-compliant (rule 13.6) 
    s2 = sizeof(j2 = i2);       // Non-compliant (rule 13.6) 
    s2 = sizeof(j2 += i2);      // Non-compliant (rule 13.6) 
    s2 = sizeof(j2 -= 2);       // Non-compliant (rule 13.6)
    s2 = sizeof(j2 *= 2);       // Non-compliant (rule 13.6)
    s2 = sizeof(j2 /= 2);       // Non-compliant (rule 13.6)
    s2 = sizeof(j2 %= 2);       // Non-compliant (rule 13.6)
    s2 = sizeof(a2 <<= 1);      // Non-compliant (rule 13.6)
    s2 = sizeof(a2 >>= 1);      // Non-compliant (rule 13.6)
    s2 = sizeof(b2 &= 0xAB);    // Non-compliant (rule 13.6)
    s2 = sizeof(b2 ^= 0xAB);    // Non-compliant (rule 13.6)
    s2 = sizeof(b2 |= 0xAB);    // Non-compliant (rule 13.6)
    
    // Function calls
    s2 = sizeof(bar_13_6_4());
    s2 = sizeof(foo_13_6_3(bar_13_6_4()));

    // Declaration of variable-length array type; will not be corrected
    s2 = sizeof(int32_t[ n++ ]);      // Non-compliant (rule 13.6)
}
`;

const files: TestFile[] = [
    { name: "misraExample.c", code: misraExample},
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 13.6", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(21);
        expect(countMISRAErrors("13.6")).toBe(21); 

        expect(countMISRAErrors(Query.search(FileJp, {name: "misraExample.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(19);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(2);
    });
});
