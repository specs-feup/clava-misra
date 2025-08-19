#include <stddef.h>

/* custom functions for Rule 21.3 */
void* custom_malloc(size_t size) {
    (void)size;
    return NULL;
}

void* custom_calloc(size_t num, size_t size) {
    (void)num;
    (void)size;
    return NULL;
}

void* custom_realloc(void* ptr, size_t size) {
    (void)ptr;
    (void)size;
    return NULL;
}

void custom_free(void* ptr) {
    (void)ptr;
}

/* custom functions for Rule 21.6 */
void custom_printf(const char* fmt, ...) {
    (void)fmt;
}

/* custom functions for Rule 21.7 */
double custom_atof(const char* str) {
    (void)str;
    return 0.0;
}

int custom_atoi(const char* str) {
    (void)str;
    return 0;
}

long custom_atol(const char* str) {
    (void)str;
    return 0L;
}

long long custom_atoll(const char* str) {
    (void)str;
    return 0LL;
}

/* custom functions for Rule 21.8 */

void custom_abort(void) {
    /* safe replacement */
}

void custom_exit(int status) {
    (void)status;
    /* safe replacement */
}

/* custom functions for Rule 21.9 */

void custom_qsort(void* base, size_t num, size_t size, int (*compar)(const void*, const void*)) {
    (void)base;
    (void)num;
    (void)size;
    (void)compar;
}

void* custom_bsearch(const void* key, const void* base, size_t num, size_t size, int (*compar)(const void*, const void*)) {
    (void)key;
    (void)base;
    (void)num;
    (void)size;
    (void)compar;
    return NULL;
}

/* custom functions for Rule 21.10 */

int custom_difftime(int arg1, int arg2) {
    (void)arg1;
    (void)arg2;
    return 0;
}

int custom_clock(void) {
    return 0;
}

/* custom functions for Rule 21.11 */

float custom_sqrt(float x) {
    (void)x;
    return 0.0;
}