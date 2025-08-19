#include <stdint.h>

int16_t a; /* Violation of rule 8.6 (third definition) */

/*
* Non-compliant - Second defintion
* Will not be fixed, as there are multiple initializations
*/
int16_t b; /* Violation of rule 8.6 (third definition) */