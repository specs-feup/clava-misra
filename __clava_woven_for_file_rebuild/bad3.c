
enum Status {
   FAIL,
   SUCCESS,
};


typedef enum  {
   RED,
   GREEN,
} Color;


typedef enum  {
   SMALL,
   LARGE,
} Size;

typedef unsigned int my_int_type;
// Non-compliant
static enum Status test_17_4_4() {
   
   return SUCCESS;
}

// Non-compliant
static Color test_17_4_5() {
   
   return RED;
}

// Non-compliant
static my_int_type test_17_4_6() {
}

/*
Non-compliant after correction:
Config file specifies an invalid default value for 'Size' type (e.g: MEDIUM)
*/
static Size test_17_4_7() {
   
   return MEDIUM;
}

/*
Non-compliant after correction:
Config file do not specify the default value for 'double' type
*/
static double test_17_4_8() {
}
