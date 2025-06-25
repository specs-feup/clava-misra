import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const programCode = `
    static void my_void_func() {
        // Void function 
    }

    static unsigned int foo() {
        return 0;
    }

    static unsigned int bar(unsigned int n) {
        return n*n;
    }

    int main() {
        my_void_func(); // Compliant - call to void function

        unsigned int result = foo();
        (void) bar(foo()); 

        foo(); // Non-compliant
        
        return 0;
    }   
`;

const files: TestFile[] = [
    { name: "program.c", code: programCode }
];

describe("Rule 17.7", () => {
    registerSourceCode(files);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(1);
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
