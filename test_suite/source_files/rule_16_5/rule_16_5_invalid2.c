static void foo16_5_4( void )
{
    int x_var;
    switch ( x_var ) {
        case 0:
            ++x_var;
            break;
        case 1:
        case 2:
            break;
        case 5:
        case 10:
        default: /*  Violation of rule 16.5 */
        case 6:
        case 8:
            break;
    }
}