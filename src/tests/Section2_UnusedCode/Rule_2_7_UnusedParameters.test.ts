import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const failingCode = `
    int foo(int x, int y, int z); 

    int foo(int x, int y, int z) { 
        y++;
        return y;
    }

    int main() {
        int a = 5, b = 10, c = 15;
        int result1 = foo(a, b, c);

        int result2 = result1 + foo(a, b, c);
        
        return result2;
    }`;

const passingCode = `
    extern int foo(int x, int y, int z);

    static int my_func(int x, int y, int z) {
        return x + y + z;
    }
        
    static int my_func2() {
        return 0;
    }

    static int bar() { 
        return my_func(1, 2, 3) + foo(50, 51, 52);
    }`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 2.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
