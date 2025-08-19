static void foo16_4_4 (void) {
    int x_var, a_var = 14;
    switch ( x_var == 4) { /* violation of rule 16.4 and 16.7 */
        case 1:
            ++x_var;
            break;
        case 0:
            break;
    }

    switch ( x_var == 4) {  /* violation of rule 16.4 and 16.7 */
        case 0:
            ++x_var;
            if (a_var > 4) {
                x_var = 7;
                break;
            }
            break;
        case 1:
            break;
    }
}