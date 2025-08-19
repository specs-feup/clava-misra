#include <stdlib.h>

static int test_21_3_1() {
    int *pointer1 = calloc(1, sizeof(int)); /* Violation of rule 21.3 */
    int *pointer2 = malloc(sizeof(int)); /* Violation of rule 21.3 */
    pointer1 = realloc(pointer1, 2 * sizeof(int)); /* Violation of rule 21.3 */
    free(pointer1); /* Violation of rule 21.3 */
    free(pointer2); /* Violation of rule 21.3 */
    return 0;
}