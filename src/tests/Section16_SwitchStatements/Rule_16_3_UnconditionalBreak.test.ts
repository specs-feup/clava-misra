import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = 
`static void foo16_3_1( void )
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
}
`;

const failingCode = 
`static void foo16_3_2( void ) {
    int x = 4, a_16_3, b_16_3, c_16_3;
    switch (x) {
        case 1:
            a_16_3 = 1;
            break;
        case 2:  
            b_16_3 = 10; // Missing break - violation of rule 16.3
        case 6: 
        case 3:
            x++;
            // comment1
            x--;
            // comment2 Missing break - violation of rule 16.3
        default:
            c_16_3 = 30; // Missing break - violation of rule 16.3
    }
}
`;

const misraExample = `
static void foo16_3_3( void ) {
    int x = 4, a_16_3, b_16_3, c_16_3;
    switch ( x )
    {
    case 0:
        break;          /* Compliant - unconditional break */
    case 1:            /* Compliant - empty fall through allows a group */
    case 2:
        break;    
        /* Compliant*/
    case 4:
        a_16_3 = b_16_3;          /* Non-compliant - break omitted (violation of rule 16.3) */
    case 5:
        if (a_16_3 == b_16_3) {
            ++a_16_3;
            break;        /* Non-compliant - conditional break (violation of rule 16.3) */
        }
    default:
        ;               /* Non-compliant - default must also have a break (violation of rule 16.3) */
    }
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode },
    { name: "misra_example.c", code: misraExample }
];

describe("Rule 16.3", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(6);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(3);
        expect(countMISRAErrors(Query.search(FileJp, {name: "misra_example.c"}).first()!)).toBe(3);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
