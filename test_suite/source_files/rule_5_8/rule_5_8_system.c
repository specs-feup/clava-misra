#include <stdint.h>
extern int32_t count_5_8;
extern void foo_5_8 (void);

static void use_externs_5_8() { 
    (void) (count_5_8);
    foo_5_8();
}