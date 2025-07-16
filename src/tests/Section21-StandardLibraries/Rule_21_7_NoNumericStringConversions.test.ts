import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";
import path from "path";
import { fileURLToPath } from "url";

const failingCode_C90 = `
#include <stdlib.h>

int main() {
    double d = atof("3.14");
    int i = atoi("42");
    long l = atol("123456");
    return 0;
}
`;

const failingCode_C99 = `
#include <stdlib.h>

int main() {
    double d = atof("3.14");
    int i = atoi("42");
    long l = atol("123456");
    long long ll = atoll("1234567890");
    return 0;
}
`;

const customStdLib = `
#include <stddef.h>

double my_atof(const char* str) {
    (void)str;
    return 0.0;
}

int my_atoi(const char* str) {
    (void)str;
    return 0;
}

long my_atol(const char* str) {
    (void)str;
    return 0L;
}

long long my_atoll(const char* str) {
    (void)str;
    return 0LL;
}
`;

const systemFile = `
extern double my_atof(const char* str);
extern int my_atoi(const char* str);
extern long my_atol(const char* str);
extern long long my_atoll(const char* str);
`;

const stdVerstion = Clava.getStandard();
const files: TestFile[] = [
    { name: "bad1.c", code: stdVerstion === "c90" ? failingCode_C90 : failingCode_C99 },
    { name: "custom_stdlib.c", code: customStdLib },
    { name: "rule_21_7_system.c", code: systemFile }
];

describe("Rule 21.7", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configFilename = "misra_config.json";
    const configFilePath = path.join(__dirname, configFilename);

    registerSourceCode(files, configFilePath);

    it("should detect errors", () => {
        expect(countMISRAErrors()).toBe(stdVerstion === "c90" ? 3 : 4);  
        expect(countMISRAErrors("21.7")).toBe(stdVerstion === "c90" ? 3 : 4); 
    });

    it("should correct errors", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
