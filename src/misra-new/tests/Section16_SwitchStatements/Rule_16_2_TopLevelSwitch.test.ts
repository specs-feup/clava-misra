import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = 
`void foo1( void ) {
    int x, y;
    switch ( x )
    {
        case 1: 
            if ( y == 1 ) {
                x = 1;
            }
            break;
        default:
            break;
    }
}`;

const failingCode = 
`void foo2( void ) {
    int x, y;
    switch ( x )
    {
        case 1: /* Compliant */
            if ( y == 1 )
            {
                case 2: /* Non-compliant */
                x = 1;
            }
            break;
        default:
            break;
    }
}`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.2", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
