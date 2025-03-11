import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = 
`void foo16_3_1( void )
{
    int x, a, b;
    switch ( x )
    {
        case 0:
            break; 
        case 1:
        case 2:
            break; 
        case 4:
            a = b;
            break;
        case 5:
            if ( a == b )
            {
                ++a;
                break;
            }
            break;
        default:
            break;
    }
}`;

const failingCode = 
`void foo16_3_2( void )
{
    int x, a, b;
    switch ( x )
    {
        case 0:
            break; 
        case 1: /* Compliant - empty fall through allows a group */
        case 2:
            break;
        case 4:
            a = b; /* Non-compliant */
        case 5:
            if ( a == b )
            {
                ++a; 
                break;/* Non-compliant - conditional break */
            }
        default:
            ; /* Non-compliant - default must also have a break */
    }
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.3", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(3);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
