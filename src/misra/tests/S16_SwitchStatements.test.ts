import MISRAReporter from "../MISRAReporter.js";
import S16_SwitchStatementPass from "../passes/S16_SwitchStatementPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingMisc = `void f ( void )
{
    int x;
    bool flag;
    switch ( x )
{
case 1:
case 2: 
x = 1;
break;
default:
break;
}
switch (x) {
    case 1:
    case 2:
    default:
    break;
}
}`;

const failingMisc = `void f ( void )
{
    int x;
    bool flag;
    switch ( x )
{
case 1: /* Compliant */
if ( flag )
{
case 2: /* Non-compliant */
x = 1;
}
break;
default:
break;
case 3:
break;
}
switch (x) {
    case 1:
    case 2:
    break;
}
}`;

const passingFormat = `void f ( void )
{
    int x, y, z;
    int flag;
    switch (x) {
        case 1:
            z = y+x;
            break;
        case 2:
            z = y-x;
            break;
        default:
            z = 4;
            break;
    }
    switch (flag) {
        case 0:
            x = 2;
            break;
        case 1: 
            x = 4;
            break;
        case 2:
            x = 6;
            break;
    }
    switch (z) {
        case 1:
            y = 0;
            break;
        case 6:
        case 42:
            y = 1;
            break;
        case 9139:
        default:
            y = 2;
            break;
    }
}`;

const failingFormat = `void f ( void )
{
    int x, y, z;
    bool flag;
    switch (x) {
        case 1:
            z = y+x;
        case 2:
            z = y-x;
            break;
        default:
            z = 4;
    }
    switch (flag) {
        case 0:
            x = 2;
            break;
        case 1: 
            x = 4;
            break;
    }
    switch (z) {
        case 1:
        case 6:
        case 42:
            y = 1;
            break;
        case 9139:
        default:
            y = 2;
            break;
    }
}`;

const miscFiles: TestFile[] = [
    {name: "badmmisc.c", code: failingMisc},
    {name: "goodmisc.c", code: passingMisc}
];

const formatFiles: TestFile[] = [
    {name: "badformat.c", code: failingFormat},
    {name: "goodformat.c", code: passingFormat}
];

describe("Switch statements: misc", () => {
    const reporter = new MISRAReporter();
    const pass = new S16_SwitchStatementPass(true, [2, 4, 5]);
    registerSourceCode(miscFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodmisc.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 3, Query.search(FileJp, {name: "badmisc.c"}).first() as Joinpoint);
    });
});

describe("Switch statements: format", () => {
    const reporter = new MISRAReporter();
    const pass = new S16_SwitchStatementPass(true, [1, 6, 7]);
    registerSourceCode(formatFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodformat.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 5, Query.search(FileJp, {name: "badformat.c"}).first() as Joinpoint);
    });
});