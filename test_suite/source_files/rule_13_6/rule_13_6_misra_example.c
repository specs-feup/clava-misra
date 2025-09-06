#include <stdint.h>
#include <stddef.h>

static void test_13_6_1(void) {
    volatile int32_t var_i;
    int32_t var_j; 
    size_t s;

    s = sizeof(var_j);               
    s = sizeof(var_j++);             /* Non-compliant (rule 13.6) */
    s = sizeof(var_i);               
    s = sizeof(int32_t);         
}

static void f(int32_t n) { 
    static volatile uint32_t v; 
    size_t s;
    s = sizeof(int32_t[n]);                            /* Compliant */
    s = sizeof(int32_t[n++]);                          /* Non-compliant (rule 13.6) */ 
}