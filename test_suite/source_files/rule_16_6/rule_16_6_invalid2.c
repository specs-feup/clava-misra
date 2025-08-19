static int foo16_6_3( void )
{
    int x_var = 10, a_var, b_var;

    switch ( x_var ) { /* Violation of rule 16.6 */
        case 1: 
        case 3:
        default:
            a_var = 10;
            b_var = a_var * 2;
            break;  
    }
    return x_var;
}