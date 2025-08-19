extern int good_extern_obj;
extern int good_extern_function();

int bad_extern_obj = 0; /* Violation of tule 8.7 */

int bad_extern_function() { /* Violation of tule 8.7 */
    return bad_extern_obj + good_extern_obj + good_extern_function();
}

static int test_8_7_1() {
    return bad_extern_obj;
}