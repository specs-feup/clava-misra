import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

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

    void enumAsParam(enum MyEnum color) {
        int i;
        if (color == RED) {
            i = 1;
        }
    }

    enum EnumForCast1 enumAsReturn() {
        return (enum EnumForCast1) RED2;
    };

    enum EnumForCast2 enumAsReturn2() {
        int id = 2;
        return (enum EnumForCast2) id;
    };

    enum MyEnum2 color_enum = RED4;

    enum EnumForPtr *colorPtr;

    enum EnumForArray colorArray[3];
`;

const failingCodeEnum2 = `
    typedef enum {
        A1,
        B1,
        C1
    } ColorEnum2;
    ColorEnum2 colorEnum2 = A1;

    typedef enum MyColors {
        A2,
        B3,
        C4
    } ColorOption;
    enum MyColors my_color = A2;
    ColorOption color_option = B3;

    // MyColors2 tag should be removed
    typedef enum MyColors2 {
        A5,
        B6,
        C7
    } ColorOption2;
    ColorOption2 color2 = B6;
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

    void structAsParam(struct MyStruct s) {
        int xField = s.x;
    }

    struct StructForReturn1 structAsReturn() {
        return (struct StructForReturn1){1, 1.5f};
    }

    struct MyStruct2 myStruct = {10, 20.5f};
    struct StructForPtr *structPtr;
    struct StructForArray structArray[3];
`;

const failingCodeStruct2 = `
    typedef struct {
        int x;
        float y;
    } ColorStruct;
    ColorStruct colorStruct = {1, 2.5};

    typedef struct MyStruct5 {
        int x;
        float y;
    } ColorStruct2;
    struct MyStruct5 struct5 = {2, 4.5};
    ColorStruct2 colorStruct2 = {1, 2.5};

    // Violation: MyStruct3 tag will be removed
    typedef struct MyStruct3 { 
        int x;
        float y;
    } ColorStruct3;
    ColorStruct3 colorStruct3 = {10, 5.5};
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

    void unionAsParam(union MyUnion u) {
        int xField = u.x;
    }

    union UnionForReturn1 unionAsReturn() {
        return (union UnionForReturn1){.x = 1};
    }

    union MyUnion2 myUnion = {.y = 20.5f};
    union UnionForPtr *unionPtr;
    union UnionForArray unionArray[3];
`;

const files: TestFile[] = [
    { name: "testEnum1.c", code: failingCodeEnum1 },
    { name: "testEnum2.c", code: failingCodeEnum2 },
    { name: "testStruct1.c", code: failingCodeStruct1 },
    { name: "testStruct2.c", code: failingCodeStruct2 },
    { name: "testUnion1.c", code: failingCodeUnion1 },
];

describe("Rule 2.4", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(5);

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
