#include <stdint.h>

/* Compliant - First defintion but has initialization in other file
* After transformation it will have 'extern' storage class
*/
int16_t k; /* Tentative definition - becomes external */