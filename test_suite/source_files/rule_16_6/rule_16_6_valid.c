static void foo16_6_1( void )
{
    int x_var = 10, a_var;

    switch ( x_var )
    {
        case 0:
            a_var = 10;
            break; 
        default:
            break; 
    }

    switch ( x_var )
    {
        default:
            a_var = 10;
            break; 
        case 1:
        case 2:
            break; 
    }
}