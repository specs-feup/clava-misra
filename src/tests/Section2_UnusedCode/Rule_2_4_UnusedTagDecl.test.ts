import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const utils_code = `
#include <stdint.h>
#include <stdbool.h>

void use_bool(bool param) {
    (void)(param == false);
}

void use_char(char param) {
    (void)(param + 1);
}

void use_int(int param) {
    (void)(param + 1);
}

void use_int8(int8_t param) {
    (void)(param - 1);
}

void use_int16(int16_t param) {
    (void)(param * 2);
}

void use_int32(int32_t param) {
    (void)(param / 2);
}

void use_int64(int64_t param) {
    (void)(param + 100);
}

void use_uint8(uint8_t param) {
    (void)(param | 0x0F);
}

void use_uint16(uint16_t param) {
    (void)(param & 0xFF00U);
}

void use_uint32(uint32_t param) {
    (void)(param ^ 0xDEADBEEFU);
}

void use_uint64(uint64_t param) {
    (void)(param + 0x12345678U);
}

void use_uint128(unsigned __int128 param) {
    (void)(param - 42);
}

void use_float32(float param) {
    (void)(param * 1.1f);
}

void use_float64(double param) {
    (void)(param + 0.001);
}

void use_float128(long double param) {
    (void)(param / 3.14L);
}
`;

const utils_header = `
#include <stdint.h>
#include <stdbool.h>

extern void use_bool(bool param);
extern void use_char(char param);
extern void use_int(int param);
extern void use_int8(int8_t param);
extern void use_int16(int16_t param);
extern void use_int32(int32_t param);
extern void use_int64(int64_t param);
extern void use_uint8(uint8_t param);
extern void use_uint16(uint16_t param);
extern void use_uint32(uint32_t param);
extern void use_uint64(uint64_t param);
extern void use_uint128(unsigned __int128 param);
extern void use_float32(float param);
extern void use_float64(double param);
extern void use_float128(long double param);
`;

const misraExample = `
#include "utils.h"

static void unusedtag (void) {
    enum state { // Violation of rule 2.4
        S_init, 
        S_run, 
        S_sleep 
    };  
}

static void test_2_4_1() {
    typedef struct record_t { // Violation of rule 2.4
        uint16_t  key;
        uint16_t  val;
    } record1_t;

    typedef struct { 
        uint16_t  key;
        uint16_t  val;
    } record2_t;
    
    record1_t var1;
    record2_t var2;
    use_uint16(var1.key + var1.val + var2.key + var2.val);
}
`;


const failingCodeEnum1 = `
enum MyEnum { 
    RED, GREEN, BLUE 
};

enum EnumForCast1 {
    RED2, GREEN2, BLUE2
};

enum EnumForCast2 {
    RED3, GREEN3, BLUE3
};

enum MyEnum2 {
    RED4, GREEN4, BLUE4
};

enum EnumForPtr {
    RED5, GREEN5, BLUE5
};

enum EnumForArray {
    RED6, GREEN6, BLUE6
};

// Non-compliant
enum UnusedEnum {
    RED7, GREEN7, BLUE7
};

static void enumAsParam(enum MyEnum color) {
    int i;
    if (color == RED) {
        i = 1;
    }
}

static enum EnumForCast1 enumAsReturn() {
    return (enum EnumForCast1) RED2;
};

static enum EnumForCast2 enumAsReturn2() {
    int id = 2;
    return (enum EnumForCast2) id;
};

static enum MyEnum2 color_enum = RED4;

static enum EnumForPtr *colorPtr;

static enum EnumForArray colorArray[3];
`;

const failingCodeEnum2 = `
typedef enum {
    A1,
    B1,
    C1
} ColorEnum2;
static ColorEnum2 colorEnum2 = A1;

typedef enum MyColors {
    A2,
    B3,
    C4
} ColorOption;
static enum MyColors my_color = A2;
static ColorOption color_option = B3;

// MyColors2 tag should be removed
typedef enum MyColors2 {
    A5,
    B6,
    C7
} ColorOption2;
static ColorOption2 color2 = B6;
`;

const failingCodeStruct1 = `
struct MyStruct {
    int x;
    float y;
};

struct StructForReturn1 {
    int x;
    float y;
};

struct MyStruct2 {
    int x;
    float y;
};

struct StructForPtr {
    int x;
    float y;
};

struct StructForArray {
    int x;
    float y;
};

// Non-compliant: should be removed
struct UnusedStruct {
    int x;
    float y;
};

static void structAsParam(struct MyStruct s) {
    int xField = s.x;
}

static struct StructForReturn1 structAsReturn() {
    return (struct StructForReturn1){1, 1.5f};
}

static struct MyStruct2 myStruct = {10, 20.5f};
static struct StructForPtr *structPtr;
static struct StructForArray structArray[3];
`;

const failingCodeStruct2 = `
typedef struct {
    int x;
    float y;
} ColorStruct;
static ColorStruct colorStruct = {1, 2.5};

typedef struct MyStruct5 {
    int x;
    float y;
} ColorStruct2;
static struct MyStruct5 struct5 = {2, 4.5};
static ColorStruct2 colorStruct2 = {1, 2.5};

// Violation: MyStruct3 tag will be removed
typedef struct MyStruct3 { 
    int x;
    float y;
} ColorStruct3;
static ColorStruct3 colorStruct3 = {10, 5.5};
`;

const failingCodeUnion1 = `
union MyUnion {
    int x;
    float y;
};

union UnionForReturn1 {
    int x;
    float y;
};

union MyUnion2 {
    int x;
    float y;
};

union UnionForPtr {
    int x;
    float y;
};

union UnionForArray {
    int x;
    float y;
};

// Non-compliant: should be removed
union UnusedUnion {
    int x;
    float y;
};

static void unionAsParam(union MyUnion u) {
    int xField = u.x;
}

static union UnionForReturn1 unionAsReturn() {
    return (union UnionForReturn1){.x = 1};
}

static union MyUnion2 myUnion = {.y = 20.5f};
static union UnionForPtr *unionPtr;
static union UnionForArray unionArray[3];
`;

const files: TestFile[] = [
    { name: "utils.c", code: utils_code },
    { name: "utils.h", code: utils_header },
    { name: "misra_example.c", code: misraExample },
    { name: "testEnum1.c", code: failingCodeEnum1 },
    { name: "testEnum2.c", code: failingCodeEnum2 },
    { name: "testStruct1.c", code: failingCodeStruct1 },
    { name: "testStruct2.c", code: failingCodeStruct2 },
    { name: "testUnion1.c", code: failingCodeUnion1 },
];

describe("Rule 2.4", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(7);

        expect(countMISRAErrors(Query.search(FileJp, {name: "testEnum1.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "testEnum2.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "testStruct1.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "testStruct2.c"}).first()!)).toBe(1);
        expect(countMISRAErrors(Query.search(FileJp, {name: "testUnion1.c"}).first()!)).toBe(1);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
