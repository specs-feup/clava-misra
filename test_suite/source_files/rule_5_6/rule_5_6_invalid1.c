#include <stdint.h>
#include <stddef.h> 
typedef float float32_t;  

static void test_5_6_1 ( void ) {
    {
        typedef unsigned char u8_t;
        u8_t var_1 = 288; 
    }

    {
        typedef unsigned char u8_t; /*  Violation of rule 5.6 */
        u8_t var_2 = 288; 
    }
}

typedef float mass;

static void test_5_6_2 ( void ) {
    float32_t mass = 0.0f; /* Violation of rule 5.6 */
}

typedef struct list {
    struct list *next;
    uint16_t element;
} list; /* Compliant - exception */

typedef struct { /*  Violation of rule 5.7 */
    struct chain /*  Violation of rule 5.6 */
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