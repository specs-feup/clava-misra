#include <stdint.h>

static uint32_t good_counter = 0;

static void test_8_9_1 ( void ) {
    int32_t i_8_9;
    for (i_8_9 = 0; i_8_9 < 10; ++i_8_9) {

    }
    ++good_counter;
}

static uint32_t test_8_9_2 ( void ) {
    static uint32_t call_count = 0;
    
    ++call_count;
    ++good_counter;

    return call_count;
}