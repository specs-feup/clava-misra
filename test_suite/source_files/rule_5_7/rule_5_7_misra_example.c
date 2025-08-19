#include <stdint.h>

struct deer {
    uint16_t item_a;
    uint16_t item_b;
};

static void foo_5_7 ( void ) {
    struct deer { /* Violation of rule 5.7 */
        uint16_t item_a;
    }; 
    struct deer deer1 = { 5 };
}

typedef struct coord {
    uint16_t x_item;
    uint16_t y_item;
} coord; /* Compliant by Exception */

struct elk {
    uint16_t x_item;
};

static void test_5_7_1() {
    struct deer deer_var = {100, 200};
    coord coord_var = {50, 60}; 
    struct coord coord_struct; 
    struct elk elk_var = {100}; 
}