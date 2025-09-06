#include <stdint.h>
#include <stddef.h>

static int32_t foo_13_6_3(float n) {
    if (n > 0) {
        return 1;
    }
    return -1;
}

static float bar_13_6_4() {
    return 5.0;
}

static void test_13_6_3(int32_t n) {
    uint32_t a2 = 0x0F;
    uint32_t b2 = 0x0A;
    int32_t i2;
    int32_t j2;
    size_t s2;
    
    s2 = sizeof(i2++);          /* Non-compliant (rule 13.6) */
    s2 = sizeof(i2--);          /* Non-compliant (rule 13.6) */
    s2 = sizeof(++i2);          /* Non-compliant (rule 13.6) */ 
    s2 = sizeof(i2--);          /* Non-compliant (rule 13.6) */ 
    s2 = sizeof(j2 = i2);       /* Non-compliant (rule 13.6) */ 
    s2 = sizeof(j2 += i2);      /* Non-compliant (rule 13.6) */ 
    s2 = sizeof(j2 -= 2);       /* Non-compliant (rule 13.6) */
    s2 = sizeof(j2 *= 2);       /* Non-compliant (rule 13.6) */
    s2 = sizeof(j2 /= 2);       /* Non-compliant (rule 13.6) */
    s2 = sizeof(j2 %= 2);       /* Non-compliant (rule 13.6) */
    s2 = sizeof(a2 <<= 1);      /* Non-compliant (rule 13.6) */
    s2 = sizeof(a2 >>= 1);      /* Non-compliant (rule 13.6) */
    s2 = sizeof(b2 &= 0xAB);    /* Non-compliant (rule 13.6) */
    s2 = sizeof(b2 ^= 0xAB);    /* Non-compliant (rule 13.6) */
    s2 = sizeof(b2 |= 0xAB);    /* Non-compliant (rule 13.6) */
    
    // Function calls
    s2 = sizeof(bar_13_6_4());  /* Non-compliant (rule 13.6) */
    s2 = sizeof(
            foo_13_6_3( /* Non-compliant (rule 13.6) */
                bar_13_6_4() /* Non-compliant (rule 13.6) */
            )
        );

    // Declaration of variable-length array type; will not be corrected
    s2 = sizeof(int32_t[ n++ ]);      /* Non-compliant (rule 13.6) */
}