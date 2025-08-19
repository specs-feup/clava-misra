#include "stdint.h"

static int16_t unusedtype ( void ) {
    typedef int16_t local_Type;   /* Violation of rule 2.3 */
    return 67;
}