#include <stdint.h>

/* Compliant - First defintion but has initialization in other file
* After transformation it will have 'extern' storage class
*/
int16_t a; 

/* Compliant - First definition but has another initialization in other file
*  Will not be fixed, as there are multiple initializations
 */
int16_t b = 40; 


int16_t c; /* Compliant- First definition */