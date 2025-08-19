static void unused_label ( void ) {
    int x = 6;
    label1: /* Violation of rule 2.6 */
    x++;
}