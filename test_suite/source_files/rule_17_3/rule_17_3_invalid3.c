static unsigned int test_17_3_3() {
    int x = foo_17_3(); /* Implicit call to foo_17_3() in good.c - violation of rule 17.3 */

    (void) test_17_3_1(); /* Implicit call with wrong params - violation of rule 17.3 */
    return 0;
}