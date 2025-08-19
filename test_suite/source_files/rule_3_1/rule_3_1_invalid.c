static int test_3_1_2() {
    int x, y, z; // bad inl/*ine comment - Violation of rule 3.1
    
    /* bad // comment - violation of rule 3.1 */

    /* bad /* block comment - Violation of rule 3.1*/

    return 0;
}

/* bad // comment2 - violation of rule 3.1 */

/* invalid // comment3 - violation of rule 3.1 */