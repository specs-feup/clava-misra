#include <stdint.h>

static int32_t count_5_9; /* "count" has internal linkage */

static void foo_5_9 (void) { 
    int16_t count_5_9; /* Violation of rule 5.9 */
    int16_t index_5_9; 
}

void bar1 (void) {
    static int16_t count_5_9;  /* Violation of rule 5.9 */
    foo_5_9();
}