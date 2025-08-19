#include <stdint.h>

static uint32_t bad_counter = 0; /* Violation of rule 8.9 */

static int test_8_9_3 (void) {
    ++bad_counter;
    return bad_counter;
}