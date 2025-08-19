#include <stdint.h>

static void test_5_9_1 ( void ) { 
    int32_t index_5_9 = 0;

    count_5_9: /* Violation of rule 5.9 */
        index_5_9++;
    if (index_5_9 < 5) {
        goto count_5_9;
    }
}