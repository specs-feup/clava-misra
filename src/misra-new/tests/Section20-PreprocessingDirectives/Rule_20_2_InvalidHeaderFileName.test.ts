import Query from "@specs-feup/lara/api/weaver/Query.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";

// base folder
const passingCode = `
#include <stdio.h>
void foo();`;

const failingCode = `
void foo2();`;

const sourceCode = `
#include <passing.h>
#include <fai'ling.h>

void foo() {
    return;
}
    
void foo2() {
    return;
}`;

// folder1/sub_folder
const failingCode2 = `
void foo3();`;

const failingCode3 = `
void foo4();`;


// folder1
const sourceCode2 = `
#include <../passing.h>
#include <../fai'ling.h>
#include <sub_folder/fai'ling2.h>
#include <./sub_folder/fai'ling3.h>

void foo() {
    return;
}
    
void foo2() {
    return;
}`;

const files: TestFile[] = [
    { name: "passing.h", code: passingCode },
    { name: "fai'ling.h", code: failingCode },
    { name: "source_code.c", code: sourceCode },
    { name: "fai'ling2.h", code: failingCode2, path: "folder1/sub_folder/" },
    { name: "fai'ling3.h", code: failingCode3, path: "folder1/sub_folder/" },
    { name: "source_code2.c", code: sourceCode2, path: "folder1/" },
];

describe("Rule 20.2", () => {
    registerSourceCode(files);

    it("should detect errors in fai'l'ng.h", () => {
        expect(countMISRAErrors()).toBe(3);
    });

    it("should rename invalid header files", () => {
        expect(countErrorsAfterCorrection()).toBe(0);

        expect(Query.search(FileJp, {name: "fai'ling.h"}).get().length).toBe(0);
        expect(Query.search(FileJp, {name: "fai'ling2.h"}).get().length).toBe(0);
        expect(Query.search(FileJp, {name: "fai'ling3.h"}).get().length).toBe(0);
    });
});
