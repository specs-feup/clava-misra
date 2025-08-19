#include <stdint.h>

uint16_t x_17_7;

static uint16_t func_17_7( uint16_t para1 ) {
    return para1;
}

static void discarded_17_7(uint16_t para2) {
    func_17_7(para2);            /* Violation of rule 17.7 */
    (void) func_17_7(para2);     /* Compliant */
    x_17_7 = func_17_7(para2);   /* Compliant  */ 
}
