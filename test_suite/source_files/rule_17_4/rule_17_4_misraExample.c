#include <stdint.h>
#define V_MIN 1U
#define V_MAX 4U

static int absolute (int32_t var_17_4) {  /* Violation of rule 17.4 */
    if (var_17_4 < 0) {
        return var_17_4;
    }
  
}