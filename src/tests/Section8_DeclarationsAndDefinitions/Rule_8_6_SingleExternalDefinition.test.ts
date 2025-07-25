import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode1 = `
#include <stdint.h>

/* Compliant - First definition but has another initialization in other file
* Will not be fixed, as there are multiple initializations
*/
int16_t i = 10;
`;

const failingCode1 = `
#include <stdint.h>

/*
* Non-compliant - Second definition
* Will not be fixed, as there are multiple initializations
*/
int16_t i = 20;
`;

const passingCode2 = `
#include <stdint.h>

int16_t j; /* Tentative definition */
int16_t j = 1; /* Compliant - external definition */
`;

const passingCode3 = `
#include <stdint.h>

/* Compliant - First defintion but has initialization in other file
* After transformation it will have 'extern' storage class
*/
int16_t k; /* Tentative definition - becomes external */
`;

const failingCode3 = `
#include <stdint.h>

int16_t k = 0; /* Non-compliant- Second external definition (unique initialization)*/
`;

const failingCode4 = `
#include <stdint.h>

/* Compliant - First defintion but has initialization in other file
* After transformation it will have 'extern' storage class
*/
int16_t a; 

/* Compliant - First definition but has another initialization in other file
*  Will not be fixed, as there are multiple initializations
 */
int16_t b = 40; 


int16_t c; /* Compliant- First definition */
`;

const failingCode5 = `
#include <stdint.h>

/*
* Non-compliant - Second definition
* This is the unique initialization
*/
int16_t a = 10; 


/*
* Non-compliant - Second definition
* Will not be fixed, as there are multiple initializations
*/
int16_t b = 20;


/* 
* Non-compliant - Second declaration
* Will be changed to 'extern' 
*/
int16_t c; 
`;

const failingCode6 = `
#include <stdint.h>

/* 
* Non-compliant - Third declaration
* Will be changed to 'extern' 
*/
int16_t a;

/*
* Non-compliant - Second defintion
* Will not be fixed, as there are multiple initializations
*/
int16_t b;
`;

const passingCode4 = `
#include <stdint.h>

int16_t d;
int16_t e = 15;
`;

const passingCode5 = `
#include <stdint.h>

extern int16_t d;
extern int16_t e;

extern int16_t i;
extern int16_t j;
extern int16_t k;

extern int16_t a;
extern int16_t b;
extern int16_t c;

static int16_t findGreatestValue(void) {
    int16_t values[] = { d, e, i, j, k, a, b, c };
    int16_t max = values[0];

    for (int idx = 1; idx < sizeof(values)/sizeof(values[0]); ++idx) {
        if (values[idx] > max) {
            max = values[idx];
        }
    }
    return max;
}
`;

const files: TestFile[] = [
    { name: "good1.c", code: passingCode1 },
    { name: "bad1.c", code: failingCode1 },
    { name: "good2.c", code: passingCode2 },
    { name: "good3.c", code: passingCode3 },
    { name: "bad3.c", code: failingCode3 },
    { name: "bad4.c", code: failingCode4 },
    { name: "bad5.c", code: failingCode5 },
    { name: "bad6.c", code: failingCode6 },
    { name: "good4.c", code: passingCode4 },
    { name: "good5.c", code: passingCode5 },
];

describe("Rule 8.6", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(7);
        expect(countMISRAErrors("8.6")).toBe(7);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(3);
        expect(countErrorsAfterCorrection("8.6")).toBe(3);
    });
});
