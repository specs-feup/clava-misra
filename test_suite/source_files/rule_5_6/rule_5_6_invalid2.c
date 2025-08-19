typedef unsigned int my_int; /* Violation of rule 5.7 */

struct my_int { /*  Violation of rule 5.6 */
    float x;
    float y;
};

static unsigned int test_5_6() {
    my_int value = 42; 
    struct my_int point = { 1.5f, 2.5f };

    return 0;
}