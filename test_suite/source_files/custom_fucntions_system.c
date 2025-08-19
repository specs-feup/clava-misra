#include <stddef.h>

extern void* custom_malloc(size_t size);
extern void* custom_calloc(size_t num, size_t size);
extern void* custom_realloc(void* ptr, size_t size);
extern void custom_free(void* ptr);

extern void custom_printf(const char* fmt, ...);

extern double custom_atof(const char* str);
extern int custom_atoi(const char* str);
extern long custom_atol(const char* str);
extern long long custom_atoll(const char* str);

extern void custom_qsort(void* base, size_t num, size_t size, int (*compar)(const void*, const void*));
extern void* custom_bsearch(const void* key, const void* base, size_t num, size_t size, int (*compar)(const void*, const void*));

extern int custom_difftime(int arg1, int arg2);
extern int custom_clock(void);

extern void custom_abort(void);
extern void custom_exit(int status);

extern float custom_sqrt(float x);

static void use_externs_21_3() {
    void* p1_21_3 = custom_malloc(16);
    void* p2_21_3 = custom_calloc(4, 4);  
    void* p3_21_3 = custom_realloc(p1_21_3, 32);
    custom_free(p2_21_3);
    custom_free(p3_21_3);
}

static void use_externs_21_6() {
    char buffer_21_6[10];
    custom_printf("Done");
}

static void use_externs_21_7(void) {
    (void) custom_atof("3.14");
    (void) custom_atoi("42");
    (void) custom_atol("100000");
    (void) custom_atoll("9223372036854775807");
}

static int compare_21_9(const void* item_a, const void* item_b) {
    int arg1 = *(const int*)item_a;
    int arg2 = *(const int*)item_b;
    return (arg1 > arg2) - (arg1 < arg2);
}

static void use_externs_21_9(void) {
    int arr[5] = {5, 3, 1, 4, 2};
    int key = 3;

    custom_qsort(arr, 5, sizeof(int), compare_21_9);
    (void) custom_bsearch(&key, arr, 5, sizeof(int), compare_21_9);
}

static void use_externs_21_10() {
    (void) custom_clock();
    (void) custom_difftime(1, 0);
}

static void use_externs_21_8() {
    custom_abort();
    custom_exit(1);
}

static void use_externs_21_11() {
    (void)custom_sqrt(20.0);
}

int main() {
    return 0;
}