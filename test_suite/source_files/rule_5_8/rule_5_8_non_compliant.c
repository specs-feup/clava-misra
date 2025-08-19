#include <stdint.h>

static void test_5_8_1 ( void ) { 
    int32_t index_5_8 = 0;

    count_5_8: /* Violation of rule 5.8 */
        index_5_8++;
    if (index_5_8 < 5) {
        goto count_5_8;
    }
}

static void test_5_8_2(void) {  
    int32_t foo_5_8 = 0; /* Violation of rules 5.8 and 5.9 */
}