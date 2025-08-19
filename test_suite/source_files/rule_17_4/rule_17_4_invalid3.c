enum Status { 
    FAIL, 
    SUCCESS
};

typedef enum {
    RED,
    GREEN, 
} Color;

typedef enum {
    SMALL,
    LARGE
} Size;

typedef unsigned int my_int_type;

static enum Status test_17_4_8() { /* Violation of rule 17.4 */

}

static Color test_17_4_9() { /* Violation of rule 17.4 */

}

static my_int_type test_17_4_10() { /* Violation of rule 17.4 */

}

static Size test_17_4_11() { /* Violation of rule 17.4 */

}