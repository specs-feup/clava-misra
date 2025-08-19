static int test_3_1_3() {
    /* [Violation of rule 3.1] some comment, end comment marker accidentally omitted
    <<New Page>>
    Perform_Critical_Safety_Function( X );
    /* this comment is non-compliant */

    int x;
    int y = 6;
    int z = 3;

    x = y // /* violation of rule 3.1
        + z
    // */
    ;

    return 0;
}