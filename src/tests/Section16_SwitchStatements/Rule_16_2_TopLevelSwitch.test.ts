import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = 
`static void foo1( void ) {
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
`static void foo2( void ) {
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

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
