#include <math.h>

static unsigned int bar_17_3() {
    double value_a = 2.0, value_b = 3.0;

    double pow_result = pow(value_a, value_b); 

    /* Implicit call: <string.h> is missing */
    char lower1 = 'a';
    char upper1 = toupper(lower1); /* Violation of rule 17.3 */

    return 0;
}