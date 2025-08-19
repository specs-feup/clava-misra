#include <stdbool.h>

static void foo16_7_2( int num )
{
    int var_a = 7;
    switch (num % 3 == 0) { /* Violation of rule 16.7 */
        case 0:
            var_a *= 2;
            break;
        case 1:
            var_a += 5;
            break;
        default:
            var_a -= 3;
            break;
    }
}
    
static void foo16_7_3( bool flag )
{
    int var_a = 7;
    switch (flag) { /*  Violation of rule 16.7 */
        case 1:
            var_a *= 2;
            break;
        case 0:
            var_a += 5;
            break;
        default:
            var_a -= 3;
            break;
    }
}