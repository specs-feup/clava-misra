static void foo16_3_2( void ) {
    int x_var = 4, a_var, b_var, c_var;
    switch (x_var) {
        case 1:
            a_var = 1;
            break;
        case 2:  
            b_var = 10; /*  Missing break - violation of rule 16.3 */
        case 6: 
        case 3:
            x_var++;
            /* v */
            x_var--;
            /* comment2 Missing break - violation of rule 16.3 */
        default:
            c_var = 30; /* Missing break - violation of rule 16.3 */
    }
}