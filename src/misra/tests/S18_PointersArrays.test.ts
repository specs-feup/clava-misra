import MISRAReporter from "../MISRAReporter.js";
import S18_PointersArraysPass from "../passes/S18_PointersArraysPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingArithmetic = `void fn1 ( void )
{
    int a[ 10 ];
    int *ptr;
    int index = 0U;
    index = index + 1U; /* Compliant - rule only applies to pointers */
    a[ index ] = 0U; /* Compliant */
    ptr = &a[ 5 ]; /* Compliant */
    ptr = a;
    ptr++; /* Compliant - increment operator not + */
    //*( ptr + 5 ) = 0U; /* Non-compliant */
    ptr[ 5 ] = 0U; /* Compliant */
}

void fn3 ( int *p1, int p2[ ] )
{
    p1++; /* Compliant */
    //p1 = p1 + 5; /* Non-compliant */
    p1[ 5 ] = 0U; /* Compliant */
    p2++; /* Compliant */
    //p2 = p2 + 3; /* Non-compliant */
    p2[ 3 ] = 0U; /* Compliant */
}`;

const failingArithmetic = `void fn1 ( void )
{
    int a[ 10 ];
    int *ptr;
    int index = 0U;
    index = index + 1U; /* Compliant - rule only applies to pointers */
    a[ index ] = 0U; /* Compliant */
    ptr = &a[ 5 ]; /* Compliant */
    ptr = a;
    ptr++; /* Compliant - increment operator not + */
    *( ptr + 5 ) = 0U; /* Non-compliant */
    ptr[ 5 ] = 0U; /* Compliant */
}

void fn3 ( int *p1, int p2[ ] )
{
    p1++; /* Compliant */
    p1 = p1 + 5; /* Non-compliant */
    p1[ 5 ] = 0U; /* Compliant */
    p2++; /* Compliant */
    p2 = p2 + 3; /* Non-compliant */
    p2[ 3 ] = 0U; /* Compliant */
}`;

const passingDepth = ``;

const failingDepth = `typedef int * INTPTR;
void function ( int ** arrPar[ ] ) /* Non-compliant */
{
int ** obj2; /* Compliant */
int *** obj3; /* Non-compliant */
INTPTR * obj4; /* Compliant */
INTPTR * const * const obj5 = 0; /* Non-compliant */
int ** arr[ 10 ]; /* Compliant */
int ** ( *parr )[ 10 ]; /* Compliant */
int * ( **pparr )[ 10 ]; /* Compliant */
}
struct s
{
int * s1; /* Compliant */
int ** s2; /* Compliant */
int *** s3; /* Non-compliant */
};
struct s * ps1; /* Compliant */
struct s ** ps2; /* Compliant */
struct s *** ps3; /* Non-compliant */
int ** ( *pfunc1 )( void ); /* Compliant */
int ** ( **pfunc2 )( void ); /* Compliant */
int ** ( ***pfunc3 )( void ); /* Non-compliant */
int *** ( **pfunc4 )( void ); /* Non-compliant */`;

const failingSizes = `struct s
{
unsigned short len;
unsigned int data[ ]; /* Non-compliant - flexible array member */
} str;

void f ( void )
{
    int n = 5;
    typedef int Vector[ n ]; /* An array type with 5 elements */
    n = 7;
    Vector a1; /* An array type with 5 elements */
    int a2[ n ]; /* An array type with 7 elements */
}`;

const passingSizes = `struct s
{
unsigned short len;
unsigned int data[ 6 ]; 
} str;

void f ( void )
{
    int n = 5;
    typedef int Vector[ 5 ]; /* An array type with 5 elements */
    n = 7;
    Vector a1; /* An array type with 5 elements */
    int a2[ 7 ]; /* An array type with 7 elements */
}`;

const arithmeticFiles: TestFile[] = [
    {name: "badarithmetic.cpp", code: failingArithmetic},
    {name: "goodarithmetic.cpp", code: passingArithmetic}
];

const depthFiles: TestFile[] = [
    {name: "baddepth.cpp", code: failingDepth},
    {name: "gooddepth.cpp", code: passingDepth}
];

const sizeFiles: TestFile[] = [
    {name: "goodsizes.cpp", code: passingSizes},
    {name: "badsizes.cpp", code: failingSizes}
];

describe("Pointers and arrays: arithmetic", () => {
    const reporter = new MISRAReporter();
    const pass = new S18_PointersArraysPass(true, [4]);
    registerSourceCode(arithmeticFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodarithmetic.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 3, Query.search(FileJp, {name: "badarithmetic.cpp"}).first() as Joinpoint);
    });
});

describe("Pointers and arrays: declaration depth", () => {
    const reporter = new MISRAReporter();
    const pass = new S18_PointersArraysPass(true, [5]);
    registerSourceCode(depthFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "gooddepth.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 7, Query.search(FileJp, {name: "baddepth.cpp"}).first() as Joinpoint);
    });
});

describe("Pointers and arrays: variable size", () => {
    const reporter = new MISRAReporter();
    const pass = new S18_PointersArraysPass(true, [7,8]);
    registerSourceCode(sizeFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodsizes.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 3, Query.search(FileJp, {name: "badsizes.cpp"}).first() as Joinpoint);
    });
});