int foo_2_7(int x, int y, int z); 

int foo_2_7(
    int x, /* Violation of rule 2.7 */
    int y, 
    int z /* Violation of rule 2.7 */
) 
{ 
    y++;
    return y;
}

static int test_2_7_2() {
    int var1 = 5, var2 = 10, var3 = 15;
    int result1 = foo_2_7(var1, var2, var3);

    int result2 = result1 + foo_2_7(var1, var2, var3);
    return result2;
}