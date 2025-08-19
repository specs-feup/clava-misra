#include <stdint.h>

static void withunusedpara (uint16_t *para1, int16_t unusedpara ) { /* Violation of rule 2.7 */
    *para1 = 42U;
}