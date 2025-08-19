static int foo16_6_5( void )
{
    int x_var = 10, a_var, b_var;

    switch ( x_var ) { /* Violation of rule 16.6 */
        case 1:
        case 3:
        default:
            a_var = 10;
            b_var = a_var * 2;
            if (a_var + b_var > 14) {
                a_var = 0;
                break;
            }
            b_var = 15;
            break;  
    }
    return x_var;
}