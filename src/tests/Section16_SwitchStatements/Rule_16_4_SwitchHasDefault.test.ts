import { FileJp, If, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

const passingCode = 
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

const failingCode1 = 
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
            x--;
            break;
    }
}`;

// 4 erros: two of them are related to having boolean switch condition
const failingCode2 = 
`void foo16_4_4( void )
{
    int x, a = 14;
    switch ( x == 4) /* Default will not be introduced, as it will be converted by the other rule */
    {
        case 1:
            ++x;
            break;
        case 0:
            break;
    }

    switch ( x == 4)
    {
        case 0:
            ++x;
            if (a > 4) {
                x = 7;
                break;
            }
            break;
        case 1:
            break;
    }
}`;

// 4 errors: two of them are related to having less than two clauses
const failingCode3 = 
`void foo16_4_5( void )
{
    int x, a = 14;
    switch (x) { /* Default will not be introduced, as it will be converted by the other rule*/
        case 1:
            ++x;
            break;
    }

     switch ( x ) {
        case 0:
            ++x;
            if (a > 4) {
                x = 7;
                break;
            }
            break;
    }
}`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "good.c", code: passingCode },
];

describe("Rule 16.4", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(9);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad3.c"}).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(1);

        const bad2File = Query.search(FileJp, {name: "bad2.c"}).first()!;
        expect(Query.searchFrom(bad2File, Switch).get().length).toBe(1);

        const bad3File = Query.search(FileJp, {name: "bad3.c"}).first()!;
        expect(Query.searchFrom(bad3File, Switch).get().length).toBe(1);
    });
});
