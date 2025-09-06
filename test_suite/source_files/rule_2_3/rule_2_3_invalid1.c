typedef int OtherInt;

/* Unused type defs */
typedef OtherInt** OtherPointer; /* Violation of rule 2.3 */
typedef int MyUnusedType; /* Violation of rule 2.3 */
typedef int** MyUnusedPointer; /* Violation of rule 2.3 */

static void use_other_int() {
    OtherInt int_a = 1;
    (void) int_a;
}