static void foo16_4_1( void )
{
    int x_var;
    switch ( x_var )
    {
        case 0:
            ++x_var;
            break;
        case 1:
        case 2:
            break;
        default:
            break;
    }

    switch ( x_var )
    {
        default:
            break;
        case 0:
            ++x_var;
            break;
        case 1:
        case 2:
            break;
    }
}