static unsigned int test_17_4_4() { /*  Violation of rule 17.4 */

}

static float test_17_4_5() { /* Violation of rule 17.4 */

}

static int test_17_4_7(int w) { /* Violation of rule 17.4 */
    if (w > 0) {
        if (w < 5) {
            return 4;
        } else {
            return 5;
        }
    } else {
        if (w == 0) {
            return 0;
        }
    }
}