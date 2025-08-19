#include <stdio.h> /* Violation of rule 21.6 */

static void test_21_6_1() {
    char buffer[100];

    /* Non-compliant: call to stdio function */
    (void) printf("Enter input: "); /*  Violation of rule 21.6 */
}