static int test_2_6_1() {
    int x = 0;
    label1: /* Violation of rule 2.6 */
        x = 1;
        label2: /* Violation of rule 2.6 */
            x++;

    goto label3;

    label3: 
        x += 4;
    return 0;
}