import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode1 = `
#include <stdint.h>
#include <stddef.h> 
typedef float float32_t;  

static void test_5_6_1 ( void ) {
    {
        typedef unsigned char u8_t;
        u8_t var_1 = 288; 
    }

    {
        typedef unsigned char u8_t; // Violation of rule 5.6
        u8_t var_2 = 288; 
    }
}

typedef float mass;

static void test_5_6_2 ( void ) {
    float32_t mass = 0.0f; // Violation of rule 5.6
}

typedef struct list {
    struct list *next;
    uint16_t element;
} list; /* Compliant - exception */

typedef struct { // Violation of rule 5.7
    struct chain // Violation of rule 5.6
    {
        struct chain *list;
        uint16_t element;
    } s1;

    uint16_t length;
} chain; /* Non-compliant - tag "chain" not
* associated with typedef */

static void test_5_6_7() {
    mass var_3 = 0.0f;
    list list_var = { .next = NULL, .element = 0 };
    chain chain_var = { .s1 = { .list = NULL, .element = 0 }, .length = 0 };
}
`;

const failingCode2 = `
typedef unsigned int my_int; // Violation of rule 5.7

struct my_int { // Violation of rule 5.6
    float x;
    float y;
};

static unsigned int test_5_6() {
    my_int value = 42; 
    struct my_int point = { 1.5f, 2.5f };

    return 0;
}
`;

const failingCode3 = `
#include <stdint.h>
#include <stddef.h>

typedef float float_type;

static void compute_5_6(void) {
    {
        typedef int8_t byte_t;
        byte_t x = 1;
    }

    {
        typedef int8_t byte_t; // Violation of rule 5.6
        byte_t y = 2;
    }
}

typedef float velocity;

static void simulate(void) {
    velocity vel = 90;
    float_type velocity = 99.5; // Violation of rule 5.6
    
}

typedef struct node {
    struct node *next;
    uint16_t id;
} node; /* Compliant - exception */

static void traverse(node *head) {
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
        expect(countMISRAErrors()).toBe(8);
        expect(countMISRAErrors("5.6")).toBe(6);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection("5.6")).toBe(0);
    });
});
