import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = `
#include <stdint.h>

extern uint16_t x_17_7;

static void void_func_17_7_1() {
    x_17_7++;
}

static void test_17_7_2() {
    void_func_17_7_1();
}
`;

const misraExample = `
#include <stdint.h>

uint16_t x_17_7;

static uint16_t func_17_7( uint16_t para1 ) {
    return para1;
}

static void discarded_17_7(uint16_t para2) {
    func_17_7(para2);            /* Violation of rule 17.7 */
    (void) func_17_7(para2);     /* Compliant */
    x_17_7 = func_17_7(para2);   /* Compliant  */ 
}
`;

const files: TestFile[] = [
    { name: "good.c", code: passingCode },
    { name: "misraExample.c", code: misraExample}
];

describe("Rule 17.7", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(1);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
