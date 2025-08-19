#include <stdlib.h>

static int compare(const void* item_a, const void* item_b) {
    return (*(int*)item_a - *(int*)item_b);
}

static int test_21_9_1() {
    int arr1[] = { 5, 3, 1, 4, 2 };
    int n1 = sizeof(arr1) / sizeof(arr1[0]);
    qsort(arr1, n1, sizeof(int), compare); /* Violation of rule 21.9 */

    int arr2[] = { 1, 2, 3, 4, 5 };
    int key = 3;
    int n2 = sizeof(arr2) / sizeof(arr2[0]);
    int* item = (int*)bsearch(&key, arr2, n2, sizeof(int), compare); /* Violation of rule 21.9 */

    return 0;
}