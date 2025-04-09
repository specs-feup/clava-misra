import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { EnumDecl, FileJp, RecordJp, TypedefDecl } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
    typedef int MyInt;
    typedef MyInt AliasInt;

    typedef int BasicInt;
    typedef BasicInt* PtrToBasicInt;

    typedef int MyInt2;
    typedef int MyInt3;
    typedef int MyInt4;

    typedef struct {
        int x;
        int y; 
        MyInt2 i2;       
        MyInt3 i3[4];  
        MyInt4 *i4;   
    } MyStruct;

    typedef int MyInt5;
    typedef union {
        int x;
        int y; 
        MyInt5 i5;
    } MyUnion;

    typedef int BasicInt2;
    void foo(BasicInt2 x) {
        int a = x + 1;
    }

    typedef int BasicInt3;
    BasicInt3 bar() {
        return (BasicInt3)10;
    }

    int main() {
        AliasInt a = 1;
        BasicInt x = 10;
        MyInt4 y = 11;

        MyStruct myStructInstance = {1, 2, 3, {4, 5, 6, 7}, &y};

        MyUnion myUnionInstance;
        myUnionInstance.x = 100;

        PtrToBasicInt ptr = &x;

        return 0;
    }`;

// 3 errors
const failingCode1 = ` 
    typedef int OtherInt;

    // Unused type defs
    typedef OtherInt** OtherPointer;
    typedef int MyUnusedType;
    typedef int** MyUnusedPointer;
`;

// 4 errors, where 1 is the unused tag decl
const failingCode2 = `
    // Should be removed
    typedef struct {
        int x;
        int y; 
    } MyUnusedStruct;

    // Should be removed
    typedef struct NumberEnum {
        int x;
        int y; 
    } MyUnusedStruct2;

    // Should be replaced by the struct
    typedef struct PersonStruct {
        int id;
        char name[10];
    } Person;
    struct PersonStruct personInstance = {1, "Alice"};
`;

// 4 errors, one is from the other class
const failingCode3 = `
    // Should be removed
    typedef union {
        int x;
        int y; 
    } MyUnusedUnion1;

    // Should be removed
    typedef union NumberUnion1 {
        int x;
        int y; 
    } MyUnusedUnion2;
    
    // Should be replaced by the union
    typedef union NumberUnion {
        int intValue;
        float floatValue;
    } Number;

    union NumberUnion unionInst = {.intValue = 10};
`;

// 4 errors, one is from the other class
const failingCode4 = `
    // Should be removed
    typedef enum {
        A1,
        B1,
        C1
    } MyUnusedEnum;

    // Should be removed
    typedef enum ColorEnum2 {
        YELLOW,
        BROWN,
        WHITE
    } Color2;

    // Should be replaced by the enum
    typedef enum ColorEnum {
        RED,
        GREEN,
        BLUE
    } Color;
    enum ColorEnum colorInstance = GREEN;  
`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
    { name: "bad4.c", code: failingCode4 },
    { name: "good.c", code: passingCode }
];

describe("Rule 2.3", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(15);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad1.c"}).first()!)).toBe(3);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad2.c"}).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad3.c"}).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, {name: "bad4.c"}).first()!)).toBe(4);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);

        const badFile1 = Query.search(FileJp, {name: "bad1.c"}).first()!;
        expect(Query.searchFrom(badFile1, TypedefDecl).get().length).toBe(0);

        const badFile2 = Query.search(FileJp, {name: "bad2.c"}).first()!;
        expect(Query.searchFrom(badFile2, TypedefDecl).get().length).toBe(0);
        expect(Query.searchFrom(badFile2, RecordJp).get().length).toBe(1);

        const badFile3 = Query.search(FileJp, {name: "bad3.c"}).first()!;
        expect(Query.searchFrom(badFile3, TypedefDecl).get().length).toBe(0);
        expect(Query.searchFrom(badFile3, RecordJp).get().length).toBe(1);

        const badFile4 = Query.search(FileJp, {name: "bad4.c"}).first()!;
        expect(Query.searchFrom(badFile4, TypedefDecl).get().length).toBe(0);
        expect(Query.searchFrom(badFile4, EnumDecl).get().length).toBe(1);
    });
});
