#include <stdbool.h>

static void foo16_7_4( bool flag )
{
    int var_a = 7, var_b = 10;
    switch (flag) { /* Violation of rule 16.7 */
        case 1:
            var_a *= 2;
            if (var_a * var_a > 10) {
                var_b = 12;
                break;
            }
            break;
        case 0:
            var_a += 5;
            break;
        default:
            var_a -= 3;
            break;
    }
}