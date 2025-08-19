#include <stdint.h>

static uint16_t total_17_7 (uint16_t n, uint16_t param_a [static 20]) { /* Violation of rule 17.6 */
    uint16_t i_var;
    uint16_t sum = 0U;

    /* Undefined behaviour if a has fewer than 20 elements */
    for (i_var = 0U; i_var < n; ++i_var){
        sum = sum + param_a[ i_var ];
    }
    return sum;
}

static void g_17_7 (void) { 
    uint16_t x;
    uint16_t v1[10];
    uint16_t v2[ 20 ];

    x = total_17_7(10U, v1);
    x = total_17_7(20U, v2);
}