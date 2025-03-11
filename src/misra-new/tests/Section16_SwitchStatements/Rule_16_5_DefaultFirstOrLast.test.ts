import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

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
}`;

const passingCode2 = 
`void foo16_5_2( void )
{
    int x;
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
    { name: "good1.c", code: passingCode1 },
    { name: "good2.c", code: passingCode2 }
];

describe("Rule 16.5", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(4);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
