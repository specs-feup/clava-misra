#include <stdlib.h>

static int test_21_8_1() {
    abort(); /* Violation of rule 21.8 */
    exit(1);  /* Violation of rule 21.8 */
    return 0;
}