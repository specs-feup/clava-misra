import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>
typedef float float32_t;  

void func ( void )
{
    {
        typedef unsigned char u8_t;
    }

    {
        typedef unsigned char u8_t; /* Non-compliant - reuse */
    }
}

typedef float mass;

void func1 ( void )
{
    float32_t mass = 0.0f; /* Non-compliant - reuse */
}

typedef struct list
{
    struct list *next;
    uint16_t element;
} list; /* Compliant - exception */

typedef struct
{
    struct chain
    {
        struct chain *list;
        uint16_t element;
    } s1;

    uint16_t length;
} chain; /* Non-compliant - tag "chain" not
* associated with typedef */
`;

const failingCode2 = `
typedef unsigned int my_int;

struct my_int {
    float x;
    float y;
};

unsigned int test_5_6() {
    my_int value = 42;
    struct my_int point = { 1.5f, 2.5f };

    return 0;
}
`;

const failingCode3 = `
#include <stdint.h>
#include <stddef.h>

typedef float float_type;

void compute(void)
{
    {
        typedef int8_t byte_t;
        byte_t x = 1;
    }

    {
        typedef int8_t byte_t; /* Non-compliant - reuse */
        byte_t y = 2;
    }
}

typedef float velocity;

void simulate(void)
{
    velocity vel = 90;
    float_type velocity = 99.5; /* Non-compliant - reuse */
    
}

typedef struct node
{
    struct node *next;
    uint16_t id;
} node; /* Compliant - exception */

void traverse(node *head)
{
    while (head != NULL) {
        head = head->next;
    }
}

`;

const files: TestFile[] = [
    { name: "bad1.c", code: failingCode1 },
    { name: "bad2.c", code: failingCode2 },
    { name: "bad3.c", code: failingCode3 },
];

describe("Rule 5.6", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        
        expect(countMISRAErrors("5.6")).toBe(6);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection("5.6")).toBe(0);
    });
});
