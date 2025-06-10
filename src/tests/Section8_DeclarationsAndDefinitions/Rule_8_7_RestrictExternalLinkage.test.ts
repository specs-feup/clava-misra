import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

const passingCode = `
int good_extern_obj = 0;

int good_extern_function() {
    return ++good_extern_obj;
}
`;

const failingCode = `
extern int good_extern_obj;
extern int good_extern_function();

int bad_extern_obj = 0;

int bad_extern_function() {
    return bad_extern_obj + good_extern_obj + good_extern_function();
}

static test_8_7_1() {
    return bad_extern_obj;
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 8.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);

        expect(countMISRAErrors(Query.search(FileJp, {name: "bad.c"}).first()!)).toBe(2);
        expect(countMISRAErrors(Query.search(FileJp, {name: "good.c"}).first()!)).toBe(0);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(1);
    });
});
