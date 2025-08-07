import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = 
`static void foo16_7_1( int num )
{
    switch (num) { 
        case 0:
            num *= 2;
            break;
        case 1:
            num += 5;
            break;
        default:
            num -= 3;
            break;
    }
}`;

const failingCode1 = 
`
#include <stdbool.h>

static void foo16_6_2( int num )
{
    int a = 7;
    switch ((num % 3) == 0) { 
        case 0:
            a *= 2;
            break;
        case 1:
            a += 5;
            break;
        default:
            a -= 3;
            break;
    }
}
    
static void foo16_6_3( bool flag )
{
    int a = 7;
    switch (flag) { 
        case 1:
            a *= 2;
            break;
        case 0:
            a += 5;
            break;
        default:
            a -= 3;
            break;
    }
}
`;

const failingCode2 = 
`
#include <stdbool.h>

static void foo16_6_4( bool flag )
{
    int a = 7, b = 10;
    switch (flag) { 
        case 1:
            a *= 2;
            if (a * a > 10) {
                b = 12;
                break;
            }
            break;
        case 0:
            a += 5;
            break;
        default:
            a -= 3;
            break;
    }
}`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(3);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(1);
    });
});
