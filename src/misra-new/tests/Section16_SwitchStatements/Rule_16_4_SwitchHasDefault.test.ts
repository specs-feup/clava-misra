import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode1 = 
`void foo16_4_1( void )
{
    int x;
    switch ( x )
    {
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
`void foo16_4_2( void )
{
    int x;
    switch ( x )
    {
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

const failingCode = 
`void foo16_4_3( void )
{
    int x;
    switch ( x )
    {
        case 0:
            ++x;
            break;
        case 1:
        case 2:
            break;
    }
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good1.c", code: passingCode1 },
    { name: "good2.c", code: passingCode2 }
];

describe("Rule 16.4", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
