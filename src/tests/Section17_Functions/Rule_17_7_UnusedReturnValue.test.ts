import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js"; 

const programCode = `
    void my_void_func() {
        // Void function 
    }

    unsigned int foo() {
        return 0;
    }

    unsigned int bar(unsigned int n) {
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
