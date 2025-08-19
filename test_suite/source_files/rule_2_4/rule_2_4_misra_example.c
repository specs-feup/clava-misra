#include <stdint.h>

static void unusedtag (void) {
    enum state { /* Violation of rule 2.4 */
        S_init, 
        S_run, 
        S_sleep 
    };  
}

static void test_2_4_1() {
    typedef struct record_t { /* Violation of rule 2.4 */
        uint16_t  key;
        uint16_t  val;
    } record1_t;

    typedef struct { 
        uint16_t  key;
        uint16_t  val;
    } record2_t;
    
    record1_t var1;
    record2_t var2;
    (void) (var1.key + var1.val + var2.key + var2.val);
}