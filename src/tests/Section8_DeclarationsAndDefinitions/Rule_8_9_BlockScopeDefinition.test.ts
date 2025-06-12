import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
#include <stdint.h>

static uint32_t good_counter = 0;

static void test_8_9_1 ( void ) {
    int32_t i;
    for (i = 0; i < 10; ++i) {

    }
    ++good_counter;
}

static uint32_t test_8_9_2 ( void ) {
    static uint32_t call_count = 0;
    
    ++call_count;
    ++good_counter;

    return call_count;
}
`;

const failingCode = `
#include <stdint.h>

static uint32_t bad_counter = 0;

static int test_8_9_3 (void) {
    ++bad_counter;
    return bad_counter;
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 8.9", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(1);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
