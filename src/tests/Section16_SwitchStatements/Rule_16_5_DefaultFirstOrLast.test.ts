import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode1 = 
`void foo16_5_1( void )
{
    int x;
    switch ( x ) {
        case 0:
            ++x;
            break;
        case 1:
        case 2:
            break;
        default:
            break;
    }

    switch ( x ) {
        default:
            break;
        case 0:
            ++x;
            break;
        case 1:
        case 2:
            break;
    }
}`;

const failingCode1 = 
`void foo16_5_3( void )
{
    int x;
    switch ( x ) {
        case 0:
            ++x;
            break;
        default:
            break;
        case 1:
        case 2:
            break;
    }
}`;

const failingCode2 = 
`void foo16_5_4( void )
{
    int x;
    switch ( x ) {
        case 0:
            ++x;
            break;
        case 1:
        case 2:
            break;
        case 5:
        case 10:
        default:
        case 6:
        case 8:
            break;
    }
}`;

const failingCode3 = 
`void foo16_5_5( void )
{
    int x;
    switch ( x ) {
        case 0:
            ++x;
            break;
        case 1:
        case 2:
            break;
        case 5:
        case 10:
        default:
        case 6:
        case 8:
            break;
        case 7:
            break;
    }
}`;

const failingCode4 = 
`void foo16_5_6( void )
{
    int x;
    switch ( x ) {
        case 0:
            ++x;
            break;
        case 5:
        case 6:
        default:
            break;
        case 1:
        case 2:
            break;
    }
}`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "bad4.c", code: failingCode4 },
    { name: "good.c", code: passingCode1 },
];

describe("Rule 16.5", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(4);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad3.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad4.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
