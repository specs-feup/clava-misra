#include <stdint.h>

extern int16_t d;
extern int16_t e;

extern int16_t i;
extern int16_t j;
extern int16_t k;

extern int16_t a;
extern int16_t b;
extern int16_t c;

static int16_t findGreatestValue(void) {
    int16_t values[] = { d, e, i, j, k, a, b, c };
    int16_t max = values[0];

    for (int idx = 1; idx < sizeof(values)/sizeof(values[0]); ++idx) {
        if (values[idx] > max) {
            max = values[idx];
        }
    }
    return max;
}