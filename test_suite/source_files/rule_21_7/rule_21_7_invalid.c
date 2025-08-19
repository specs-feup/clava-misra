#include <stdlib.h>

static int test_21_7_1() {
    double var_d = atof("3.14"); /* Violation 21.7 */
    int var_i = atoi("42");  /* Violation 21.7 */
    long var_l = atol("123456");  /* Violation 21.7 */
    return 0;
}