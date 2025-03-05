import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

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

const failingCode = `
    typedef int OtherInt;
    typedef OtherInt** OtherPointer;

    // Unused type defs
    typedef int MyUnusedType;

    typedef struct {
        int x;
        int y; 
    } MyUnusedStruct;

    typedef union {
        int x;
        int y; 
    } MyUnusedUnion;

    typedef int** MyUnusedPointer;

    int main() {
        return 0;
    }`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 2.3", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(5);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
