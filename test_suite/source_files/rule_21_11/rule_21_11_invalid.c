#include <tgmath.h> /* Violation of rule 21.11 */

static void test_21_11_1(void) {
    float f1, f2;
    f1 = sqrt(f2); /* Violation of rule 21.11 */
}