static int test_2_6_2() {
    int x = 0;
    goto label1;

    label1: 
        x++;

    return 0;
}