static int foo16_6_4( void )
{
    int x_var = 10, a_var, b_var;

    switch ( x_var ) { /* Violation of rule 16.6, 16.4 */
        case 1: 
        case 3:
            a_var = 10;
            b_var = a_var * 2;
            break;  
    }
    return x_var;
}