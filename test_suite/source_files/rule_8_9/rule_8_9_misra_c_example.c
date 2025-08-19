#include <stdint.h>

static uint32_t test_8_9_4 ( void ) {
    static uint32_t call_count = 0;
    ++call_count;
    return call_count;
}