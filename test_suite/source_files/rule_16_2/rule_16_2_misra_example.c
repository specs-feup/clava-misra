static void foo2( void ) {
    int x, y;
    switch ( x )
    {
        case 1: /* Compliant */
            if ( y == 1 )
            {
                case 2: /* Violation of rule 16.2 */
                x = 1;
            }
            break;
        default:
            break;
    }
}