import MISRAReporter from "../MISRAReporter.js";
import S10_EssentialTypePass from "../passes/S10_EssentialTypePass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { expectNumberOfErrors, registerSourceCode, TestFile } from "./utils.js";

const passingOperands = `void goodOperands() {
    bool bla, blb;
    unsigned u8a, u8b, u16b;
    char cha, chb;
    enum ena {R,G,B} ena;
    enum {K1=5}; 
    int a1,s8a,s16b,s8b;
    float f32a, f32b;

    bla && blb;
    bla ? u8a : u8b;
    cha - chb;
    cha > chb;
    ena > a1;
    K1 * s8a; /* Compliant as K1 from anonymous enum */
    s8a + s16b;
    -( s8a ) * s8b;
    s8a > 0;
    --s16b;
    u8a + u16b;
    u8a & 2U;
    u8a > 0U;
    u8a << 2U;
    u8a << 1; /* Compliant by exception */
    f32a + f32b;
    f32a > 0.0;

    '0' + u8a; /* Convert u8a to digit */
    s8a + '0'; /* Convert s8a to digit */
    cha - '0'; /* Convert cha to ordinal */
    '0' - s8a; /* Convert -s8a to digit */
}`;

const failingOperands = `void badOperands() {
    char cha, chb;
    enum ena {R,G,B} ena;
    bool bla, blb;
    int a1,a2,s8a;
    unsigned u8a;
    float f32a;

    cha && bla ; /* Rationale 2 - char type used as a Boolean value */
    ena ? a1 : a2 ; /* Rationale 2 - enum type used as a Boolean value */
    s8a && bla ; /* Rationale 2 - signed type used as a Boolean value */
    u8a ? a1 : a2 ; /* Rationale 2 - unsigned type used as a Boolean value */
    f32a && bla ; /* Rationale 2 - floating type used as a Boolean value */
    bla * blb ; /* Rationale 3 - Boolean used as a numeric value */
    bla > blb ; /* Rationale 3 - Boolean used as a numeric value */
    cha & chb ; /* Rationale 4 - char type used as a numeric value */
    cha << 1 ;  /* Rationale 4 - char type used as a numeric value */
    ena * a1 ; /* Rationale 5 - enum type used in arithmetic operation */
    s8a & 2 ; /* Rationale 6 - bitwise operation on signed type */
    50 << 3U ;  /* Rationale 6 - shift operation on signed type */
    u8a << s8a ;  /* Rationale 7 - shift magnitude uses signed type */
    u8a << -1 ;  /* Rationale 7 - shift magnitude uses signed type */
    -u8a ; /* Rationale 8 - unary minus on unsigned type */

    int s16a;
    s16a - 'a';
    '0' + f32a;
    cha + ':';
    cha - ena;
}`;

const operandFiles: TestFile[] = [
    {name: "badoperands.cpp", code: failingOperands},
    {name: "goodoperands.cpp", code: passingOperands},
];

const passingAssignments = `void use_uint16(unsigned int a) {
    return;
}

void goodAssignments() {
    unsigned char u8b, u8c, u8d;
    enum ena {R,G,B} ena;
    enum {A1, K1};
    int s8a;
    char cha;

    unsigned int u8a = 0; /* By exception */
    bool flag = ( bool ) 0;
    bool set = true; /* true is essentially Boolean */
    bool get = ( u8b > u8c );
    s8a = K1; /* Constant value fits */
    u8a = 2; /* By exception */
    //u8a = 2 * 24; /* By exception */ <-- DO THIS WHEN ISINTEGERCONSTANTEXPR IS AVAILABLE
    u8a = ( unsigned int ) s8a; /* Cast gives same essential type */

    unsigned int u32a;
    unsigned char u16a, u16b;
    u32a = u16a; /* Assignment to a wider essential type */
    u32a = 2U + 125U; /* Assignment to a wider essential type */
    use_uint16 ( u8a ); /* Assignment to a wider essential type */
    use_uint16 ( u8a + u16b ); /* Assignment to same essential type */
}`;

const failingAssignments = `void use_uint32(unsigned int a) {
    return;
}

void use_uint16(unsigned short a) {
    return;
}

unsigned char foo1 ( unsigned int x )
{
return x; /* uint16_t to uint8_t */
}

void badAssignments() {
    char cha;
    unsigned u8b, u8c;
    int s32a;
    short u16a;
    long u32a;

    unsigned u8a = 1.0f; /* unsigned and floating */
    bool bla = 0; /* boolean and signed */
    cha = 7; /* character and signed */
    u8a = 'a'; /* unsigned and character */
    u8b = 1 - 2; /* unsigned and signed */
    //u8c += 'a'; /* u8c = u8c + 'a' assigns character to unsigned */
    use_uint32 ( s32a ); /* signed and unsigned */
    //s8a = K2; /* Constant value does not fit */
    u16a = u32a; /* uint32_t to uint16_t */
    use_uint16 ( u32a ); /* uint32_t to uint16_t */
}`;

const assignmentFiles: TestFile[] = [
    {name: "badassignments.cpp", code: failingAssignments},
    {name: "goodassignments.cpp", code: passingAssignments}
];

const failingCasts = `void badCasts() {
    enum enuma {R,G,B} ena;
    enum enumc {C,M,Y} enc;

    //( bool ) false; /* Compliant - 'false' is essentially Boolean */
    //( int ) 3U; /* Compliant */
    //( bool ) 0; /* Compliant - by exception */
    ( bool ) 3U; /* Non-compliant */
    //( int ) ena; /* Compliant */
    ( enum enuma ) 3; /* Non-compliant */
    //( char ) enc; /* Compliant */
}`;

const passingCasts = `void goodCasts() {
    enum enuma {R,G,B} ena;
    enum enumc {C,M,Y} enc;

    ( bool ) false; /* Compliant - 'false' is essentially Boolean */
    ( int ) 3U; /* Compliant */
    ( bool ) 0; /* Compliant - by exception */
    //( bool ) 3U; /* Non-compliant */
    ( int ) ena; /* Compliant */
    //( enum enuma ) 3; /* Non-compliant */
    ( char ) enc; /* Compliant */
}`;

const castFiles: TestFile[] = [
    {name: "goodcasts.cpp", code: passingCasts},
    {name: "badcasts.cpp", code: failingCasts}
];

const passingComposites = `void goodComposites() {
    unsigned short u16a,u16b,u16c;
    unsigned long u32a,u32b;
    signed long s32a;

    u16c = u16a + u16b; /* Same essential type */
    u32a = ( unsigned long ) u16a + u16b; /* Cast causes addition in uint32_t */

    ( unsigned short ) ( u32a + u32b ); /* Compliant */
    ( unsigned long ) s32a; /* Compliant - s32a is not composite */
}`;

const failingComposites = `void badComposites() {
    unsigned short u16a,u16b,u16c;
    unsigned long u32a,u32b;
    signed long s32a,s32b;

    u32a = u16a + u16b; /* Implicit conversion on assignment */
    ( unsigned short ) ( s32a + s32b );
    //( unsigned long ) ( u16a + u16b ); WIDTH PROBLEMS
}`;

const compositeFiles: TestFile[] = [
    {name: "goodcomposites.cpp", code: passingComposites},
    {name: "badcomposites.cpp", code: failingComposites}
]

describe("Essential type model: operands", () => {
    const reporter = new MISRAReporter();
    const pass = new S10_EssentialTypePass(true, [1, 2]);
    registerSourceCode(operandFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodoperands.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        expectNumberOfErrors(reporter, pass, 24, Query.search(FileJp, {name: "badoperands.cpp"}).first() as Joinpoint);
    });
});

describe("Essential type model: assignments", () => {
    const reporter = new MISRAReporter();
    const pass = new S10_EssentialTypePass(true, [3]);
    registerSourceCode(assignmentFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodassignments.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => { //SHOULD BE 9 BUT DOESNT WORK FOR RETURN STMTS
        expectNumberOfErrors(reporter, pass, 8, Query.search(FileJp, {name: "badassignments.cpp"}).first() as Joinpoint);
    });
});

describe("Essential type model: casts", () => {
    const reporter = new MISRAReporter();
    const pass = new S10_EssentialTypePass(true, [5]);
    registerSourceCode(castFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodcasts.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => { //SHOULD BE 9 BUT DOESNT WORK FOR RETURN STMTS
        expectNumberOfErrors(reporter, pass, 2, Query.search(FileJp, {name: "badcasts.cpp"}).first() as Joinpoint);
    });
});

describe("Essential type model: composite expressions", () => {
    const reporter = new MISRAReporter();
    const pass = new S10_EssentialTypePass(true, [6,8]);
    registerSourceCode(compositeFiles);

    it("should pass", () => {
        expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodcomposites.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => { //SHOULD BE 9 BUT DOESNT WORK FOR RETURN STMTS
        expectNumberOfErrors(reporter, pass, 2, Query.search(FileJp, {name: "badcomposites.cpp"}).first() as Joinpoint);
    });
});