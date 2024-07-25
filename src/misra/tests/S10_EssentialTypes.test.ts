import MISRAReporter from "../MISRAReporter.js";
import S10_EssentialTypePass from "../passes/S10_EssentialTypePass.js";
import Query from "lara-js/api/weaver/Query.js";
import { FileJp, Joinpoint } from "clava-js/api/Joinpoints.js";
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
    u8c += 'a'; /* u8c = u8c + 'a' assigns character to unsigned */
    use_uint32 ( s32a ); /* signed and unsigned */
    //s8a = K2; /* Constant value does not fit */
    u16a = u32a; /* uint32_t to uint16_t */
    use_uint16 ( u32a ); /* uint32_t to uint16_t */
}`;

const assignmentFiles: TestFile[] = [
    {name: "badassignments.cpp", code: failingAssignments}
];

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
        //expectNumberOfErrors(reporter, pass, 0, Query.search(FileJp, {name: "goodoperands.cpp"}).first() as Joinpoint);
    });
    
    it("should fail", () => {
        //expectNumberOfErrors(reporter, pass, 10, Query.search(FileJp, {name: "badoperands.cpp"}).first() as Joinpoint);
    });
});