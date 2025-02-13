import MISRAReporter from "../MISRAReporter.js";
import S13_SideEffectPass from "../passes/S13_SideEffectPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `int v1;
void f1 ( void )
{
int a[ 2 ] = { v1, 0 };
}
int x = 0u;
extern void p ( int a[ 2 ] );
void h1 ( void )
{
/* Non-compliant - two side effects */
p ( ( int[ 2 ] ) { x, x } );
}

void foo1() {
    unsigned u8a, u8b;
    int a[4], x, y, s;
    u8a = ( 1u == 1u ) ? 0u : u8b;
    u8b++;
    s = sizeof ( 5 ); 
    if ( ( x == 0u ) || ( v1 == 1u ) )
{
}
}`;

const failingCode = `volatile int v1;
void f ( void )
{
/* Non-compliant - volatile access is persistent side effect */
int a[ 2 ] = { v1, 0 };
}
int x = 0u;
extern void p ( int a[ 2 ] );
void h ( void )
{
/* Non-compliant - two side effects */
p ( ( int[ 2 ] ) { x++, x++ } );
}

int bar() {
    return 5;
}

void foo() {
    unsigned u8a, u8b;
    int a[4], x, y, s;
    u8a = ( 1u == 1u ) ? 0u : u8b++;
    s = sizeof ( bar() ); /* Non-compliant */
    a[ x ] = a[ x = y ];
    if ( ( x == 0u ) || ( v1 == 1u ) )
{
}
}`;

const files: TestFile[] = [
    {name: "bad.c", code: failingCode},
    {name: "good.c", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S13_SideEffectPass(true, [1, 3, 4, 5, 6]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "good.c"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 8, Query.search(FileJp, {name: "bad.c"}).first() as Joinpoint);
    });
});