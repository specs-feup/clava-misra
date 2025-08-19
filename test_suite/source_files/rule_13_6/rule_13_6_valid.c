#include <stdint.h>
#include <stddef.h>

static void test_13_6_2(int32_t n1, int32_t buffer[]) {
    size_t s1;
    volatile int32_t i1;
    int32_t j1; 

    s1 = sizeof(j1);                /* Compliant */
    s1 = sizeof(i1);                /* Compliant - exception */
    s1 = sizeof(i1 + j1);           /* Compliant */
    s1 = sizeof(int32_t);           /* Compliant */
    s1 = sizeof( int32_t[ n1 ] );   /* Compliant */
    s1 = sizeof(buffer[s1]);        /* Compliant */
}