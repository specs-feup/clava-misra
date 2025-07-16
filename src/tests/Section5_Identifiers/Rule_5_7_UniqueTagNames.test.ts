import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>

struct deer {
    uint16_t a;
    uint16_t b;
};

static void foo ( void ) {
    struct deer { // Violation of rule 5.7
        uint16_t a;
    }; 
    struct deer deer1 = { 5 };
}

typedef struct coord {
    uint16_t x;
    uint16_t y;
} coord; /* Compliant by Exception */

struct elk {
    uint16_t x;
};

static void test_5_7_1() {
    struct deer deer_var = {100, 200};
    coord coord_var = {50, 60}; 
    struct coord coord_struct; 
    struct elk elk_var = {100}; 
}
`;


const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 }
];

describe("Rule 5.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(1);
        expect(countMISRAErrors("5.7")).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection("5.7")).toBe(0);
    });
});
