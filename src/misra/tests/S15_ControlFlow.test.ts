import MISRAReporter from "../MISRAReporter.js";
import S15_ControlFlowPass from "../passes/S15_ControlFlowPass.js";
import Query from "lara-js/api/weaver/Query.js";
import { FileJp, Joinpoint } from "clava-js/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingCode = `void f ( void )
{
int j = 0;
++j;
if ( 10 == j )
{
goto L2; /* Compliant */
}
L2 :
++j;
}

void f1 ( int a )
{
if ( a <= 0 )
{
}
goto L1; /* Compliant */
if ( a == 0 )
{
goto L1; /* Compliant */
}
L1:
if ( a > 0 )
{
L2:
;
}
}

void f2() {
   int x,y,z;
   while ( x != 0u )
{
x = 5;
if ( x == 1u )
{
break;
}
while ( y != 0u )
{
y = 6;
if ( y == 1u )
{
goto L1;
}
}
L1:
z = x + y;
}
}

int main(int argc, char *argv[]) {


    return 0;
}`;

const failingCode = `void g ( void )
{
int j = 0;
L1:
++j;
if ( 10 == j )
{
goto L2; /* Compliant */
}
goto L1; /* Non-compliant */
L2 :
++j;
}

void g1 ( int a )
{
if ( a <= 0 )
{
goto L2; /* Non-compliant */
}
goto L1; /* Compliant */
if ( a == 0 )
{
goto L1; /* Compliant */
}
goto L2; /* Non-compliant */
L1:
if ( a > 0 )
{
L2:
;
}
}

void g2() {
   int x,y,z;
   while ( x != 0u )
{
x = 5;
if ( x == 1u )
{
break;
}
while ( y != 0u )
{
y = 6;
if ( y == 1u )
{
goto L1;
}
}
}
L1:
z = x + y;
}

int test(int argc, char *argv[]) {


    return 0;
}`;

const files: TestFile[] = [
    {name: "bad.cpp", code: failingCode},
    {name: "good.cpp", code: passingCode}
]

describe("Expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S15_ControlFlowPass(true, [1, 2, 3, 4]);
    registerSourceCode(files);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 4, Query.search(FileJp, {name: "good.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 11, Query.search(FileJp, {name: "bad.cpp"}).first() as Joinpoint);
    });
});