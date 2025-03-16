import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp, FunctionJp, If, Switch } from "@specs-feup/clava/api/Joinpoints.js";

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

const failingCode1 = 
`int foo16_6_2( void )
{
    int x = 1;
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
    return x;
}`;

const failingCode2 = 
`int foo16_6_3( void )
{
    int x = 10, a, b;

    switch ( x )
    {
        case 1: 
        case 3:
        default:
            a = 10;
            b = a * 2;
            break;  
    }
    return x;
}`;

const failingCode3 = 
`int foo16_6_4( void )
{
    int x = 10, a, b;

    switch ( x )
    {
        case 1: /* Non-compliant*/
        case 3:
            a = 10;
            b = a * 2;
            break;  
    }
    return x;
}`;

const failingCode4 = 
`int foo16_6_5( void )
{
    int x = 10, a, b;

    switch ( x )
    {
        case 1: /* Non-compliant*/
        case 3:
        default:
            a = 10;
            b = a * 2;
            if (a + b > 14) {
                a = 0;
                break;
            }
            b = 15;
            break;  
    }
    return x;
}`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "bad4.c", code: failingCode4 },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.6", () => {
    registerSourceCode(files);

    it("should detect errors in non-compliant files", () => {
        expect(countMISRAErrors()).toBe(6);
    });

    it("should correct errors in non-compliant files", () => {
        expect(countErrorsAfterCorrection()).toBe(1);

        const badFile = Query.search(FileJp, {name: "bad1.c"}).first()!;
        expect(Query.searchFrom(badFile, Switch).get().length).toBe(0);
        expect(Query.searchFrom(badFile, If).get().length).toBe(0);
        expect(Query.searchFrom(badFile, FunctionJp).first()?.body.children.length).toBe(2);

        const bad2File = Query.search(FileJp, {name: "bad2.c"}).first()!;
        expect(Query.searchFrom(bad2File, Switch).get().length).toBe(0);
        expect(Query.searchFrom(bad2File, If).get().length).toBe(0);
        expect(Query.searchFrom(bad2File, FunctionJp).first()?.body.children.length).toBe(4);

        const bad3File = Query.search(FileJp, {name: "bad3.c"}).first()!;
        expect(Query.searchFrom(bad3File, Switch).get().length).toBe(0);
        expect(Query.searchFrom(bad3File, If).get().length).toBe(1);

        const bad4File = Query.search(FileJp, {name: "bad4.c"}).first()!;
        expect(Query.searchFrom(bad4File, Switch).get().length).toBe(1);
    });
});
