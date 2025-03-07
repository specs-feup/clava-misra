import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const test1 = `
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

    enum MyEnum2 color = RED4;

    enum EnumForPtr *colorPtr;

    enum EnumForArray colorArray[3];`;

const test2 = `
    typedef enum {
        A1,
        B1,
        C1
    } ColorEnum2;

    ColorEnum2 colorEnum2 = A1;`;

const test3 = `
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

    struct MyStruct2 mystruct = {10, 20.5f};
    struct StructForPtr *structPtr;
    struct StructForArray structArray[3];`;

const test4 = `
    typedef struct MyStruct2 { // Violation: MyStruct2 will not be used
        int x;
        float y;
    } ColorStruct;

    typedef struct {
        int x;
        float y;
    } ColorStruct2;

    ColorStruct colorStruct = {10, 5.5};
    ColorStruct2 colorStruct2 = {1, 2.5};`;

const test5 = `
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
    union UnionForArray unionArray[3];`;

const test6 = `
    typedef union MyUnion2 { // Violation: MyUnion2 will not be used
        int x;
        float y;
    } Color;

    typedef union {
        int x;
        float y;
    } Color2;

    Color color = { .x = 10 };
    Color2 color2 = { .y = 2.5f };`;

const files: TestFile[] = [
    { name: "test1.c", code: test1 },
    { name: "test2.c", code: test2 },
    { name: "test3.c", code: test3 },
    { name: "test4.c", code: test4 },
    { name: "test5.c", code: test5 },
    { name: "test6.c", code: test6 },
];

describe("Rule 2.4", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(5);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
