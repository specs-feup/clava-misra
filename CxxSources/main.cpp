void f ( void )
{
    int x, y, z;
    int flag;
    switch (x) {
        case 1:
            z = y+x;
            break;
        case 2:
            z = y-x;
            break;
        default:
            z = 4;
            break;
    }
    switch (flag) {
        case 0:
            x = 2;
            break;
        case 1: 
            x = 4;
            break;
        case 2:
            x = 6;
            break;
    }
    switch (z) {
        case 1:
            y = 0;
            break;
        case 6:
        case 42:
            y = 1;
            break;
        case 9139:
        default:
            y = 2;
            break;
    }
}