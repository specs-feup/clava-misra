static void foo16_3_1( void ) {
    int x_var, a_var, b_var;
    switch ( x_var )
    {
        case 0:
            break; 
        case 1:
        case 2:
            break; 
        case 4:
            x_var = b_var;
            break;
        case 5:
            if (x_var == b_var)
            {
                ++x_var;
                break;
            }
            break;
        default:
            break;
    }
}