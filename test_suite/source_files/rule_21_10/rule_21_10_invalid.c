#include <time.h> /* Violation of rule 21.10 */

static int test_21_10_1() {
    int execution_time = difftime(0, 5); /*  Violation of rule 21.10 */
    int start = clock(); /*  Violation of rule 21.10 */
    return 0;
}