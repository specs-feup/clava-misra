static void foo16_3_3( void ) {
    int x_var = 4, a_var, b_var;
    switch (x_var) {
    case 0:
        break;          /* Compliant - unconditional break */
    case 1:            /* Compliant - empty fall through allows a group */
    case 2:
        break;    
        /* Compliant*/
    case 4:
        a_var = b_var;          /* Non-compliant - break omitted (violation of rule 16.3) */
    case 5:
        if (a_var == b_var) { // Violation of rule 16.3
            ++a_var;
            break;        /* Non-compliant - conditional break */
        }
    default:
        ;               /* Non-compliant - default must also have a break (violation of rule 16.3) */
    }
}