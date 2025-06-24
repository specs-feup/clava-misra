import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>

struct deer {
    uint16_t a;
    uint16_t b;
};

void foo ( void ) {
    struct deer {
        uint16_t a;
    }; /* Non-compliant - tag "deer" reused */
}

typedef struct coord {
    uint16_t x;
    uint16_t y;
} coord; /* Compliant by Exception */

struct elk {
    uint16_t x;
};
`;

const failingCode2 = `
#include <stdint.h>

struct packet {
    uint16_t header;
    uint16_t payload;
};

struct packet p1 = { 0xAAAA, 0xBBBB};


void test_5_7_1(void) {
    struct packet {
        uint16_t header;
    }; /* Non-compliant - tag "packet" reused */

    struct packet p2 = { 0xABCD };
}

typedef struct vector {
    uint16_t x;
    uint16_t y;
} vector; /* Compliant by Exception */

vector v1 =  {0xAAAA, 0xBBBB };

struct config {
    uint16_t mode;
};

struct config c1 = { 1 };
`;


const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 }
];

describe("Rule 5.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        
        expect(countMISRAErrors("5.7")).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection("5.7")).toBe(0);
    });
});
