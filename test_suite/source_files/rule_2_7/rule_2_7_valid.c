extern int foo_2_7(int x, int y, int z);

static int test_2_7_1(int x, int y, int z) { 
    return x + y + z;
}

static int bar_2_7() { 
    return test_2_7_1(1, 2, 3) + foo_2_7(50, 51, 52);
}