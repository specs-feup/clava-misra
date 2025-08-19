static void foo16_4_3( void ) {
    int x_var;
    switch (x_var) { /* violation of rule 16.4 */
        case 0:
            ++x_var;
            break;
        case 1:
        case 2:
            x_var--;
            break;
    }
}