static void test_17_3_2() {
    double value_a = 2.0, value_b = 3.0;

    /* Implicit call to pow(): <math.h> is missing */
    double res1 = pow(value_a, value_b); /* Violation of rule 17.3 */ 
    double res2 = pow(value_b, value_a); /* Violation of rule 17.3 */ 

    /* Implicit call to toupper: <ctype.h> is missing */
    char lower1 = 'a';
    char upper1 = toupper(lower1);  /* Violation of rule 17.3 */
    
    /* Implicit call to sin(): <math.h> is missing */
    double angle = 3.14159265; 
    double sin_val = sin(angle); /* Violation of rule 17.3 */

    /* Implicit call to strlen(): <ctype.h> is missing */
    char lower2 = 'b';
    char upper2 = toupper(lower2);  /* Violation of rule 17.3 */
}