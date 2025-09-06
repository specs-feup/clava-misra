#include <stdint.h>

static int8_t count_5_9; /* Violation of rule 5.9 */

static void foo_5_9 ( void ) { /* Violation of rule 5.9 */
    int32_t index_5_9;
    int16_t nbytes; 
}

/* Missing "static" keyword */
void bar2 ( void ){
    static uint8_t nbytes; 
}

void static use_static_count_3() {
    (void) count_5_9;
}

void static use_static_count_4() {
    (void) count_5_9;
}