import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

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
    int x = 4, a, b, c;
    switch (x) {
        case 1:
            a = 1;
            break;
        case 2:  // Missing break
            b = 10;
        case 6: 
        case 3:
            x++;
            // comment1
            x--;
            // comment2
        default:
            c = 30;
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

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(3);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
