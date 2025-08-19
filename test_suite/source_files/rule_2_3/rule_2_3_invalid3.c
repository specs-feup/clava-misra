/* Should be removed */
typedef union {  /*  Violation of rule 2.3 */
    int x;
    int y; 
} MyUnusedUnion1;

/* Should be removed */
typedef union NumberUnion1 {  /*  Violation of rule 2.3, 2.4 */
    int x;
    int y; 
} MyUnusedUnion2;

/* Should be replaced by the union */
typedef union NumberUnion {  /* Violation of rule 2.3 */
    int intValue;
    float floatValue;
} Number;

static union NumberUnion unionInst = {.intValue = 10};