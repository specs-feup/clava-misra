static int foo16_6_2( void )
{
    int x_var = 1;
    switch ( x_var ) { /* Violation of rule 16.6 */
        default: 
            break;  
    }

    switch ( x_var ) { /* Violation of rule 16.6 */
        case 1: 
        default:
            break;  
    }
    return x_var;
}