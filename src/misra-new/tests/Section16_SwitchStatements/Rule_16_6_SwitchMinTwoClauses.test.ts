import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = 
`void foo16_6_1( void )
{
    int x, a, b;

    switch ( x )
    {
        case 0:
            a = 10;
            break; 
        default:
            break; 
    }

    switch ( x )
    {
        default:
            a = 10;
            break; 
        case 1:
        case 2:
            break; 
    }
}`;

const failingCode = 
`void foo16_6_2( void )
{
    int x, a, b;
    switch ( x )
    {
        default: /* Non-compliant*/
            break;  
    }

    switch ( x )
    {
        case 1: /* Non-compliant*/
        default:
            break;  
    }
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.6", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
