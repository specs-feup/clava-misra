static void foo16_7_1( int num )
{
    switch (num) { 
        case 0:
            num *= 2;
            break;
        case 1:
            num += 5;
            break;
        default:
            num -= 3;
            break;
    }
}