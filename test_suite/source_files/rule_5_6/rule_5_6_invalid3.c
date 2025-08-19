#include <stdint.h>
#include <stddef.h>

typedef float float_type;

static void compute_5_6(void) {
    {
        typedef int8_t byte_t;
        byte_t x = 1;
    }

    {
        typedef int8_t byte_t; /* Violation of rule 5.6 */
        byte_t y = 2;
    }
}

typedef float velocity;

static void simulate(void) {
    velocity vel = 90;
    float_type velocity = 99.5; /* Violation of rule 5.6 */
    
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