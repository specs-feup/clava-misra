import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
int static test_3_1_1() {
    int x, y, z;// good inline comment
    // good */ comment
    // good // comment
    return 0;
}
`;

const failingCode = `
static int test_3_1_2() {
    int x, y, z; // bad inl/*ine comment - Violation of rule 3.1
    
    /* bad // comment - violation of rule 3.1 */

    /* bad /* block comment - Violation of rule 3.1*/

    return 0;
}
`;

const misraExample = `
static int test_3_1_3() {
    /* [Violation of rule 3.1] some comment, end comment marker accidentally omitted
    <<New Page>>
    Perform_Critical_Safety_Function( X );
    /* this comment is non-compliant */

    int x;
    int y = 6;
    int z = 3;

    x = y // /* violation of rule 3.1
        + z
    // */
    ;

    return 0;
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode },
    { name: "misra_c_example.c", code: misraExample },
];

describe("Rule 3.1", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(4);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "misra_c_example.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
