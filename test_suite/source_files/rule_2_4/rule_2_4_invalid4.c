typedef struct {
    int x;
    float y;
} ColorStruct;

typedef struct MyStruct5 {
    int x;
    float y;
} ColorStruct2;

typedef struct MyStruct3 { /* Violation of rule 2.4 */
    int x;
    float y;
} ColorStruct3;

static void use_tags_2_4_4() {
    static ColorStruct colorStruct = {1, 2.5};
    static struct MyStruct5 struct5 = {2, 4.5};
    static ColorStruct2 colorStruct2 = {1, 2.5};
    static ColorStruct3 colorStruct3 = {10, 5.5};

    (void) colorStruct;
    (void) struct5;
    (void) colorStruct2;
    (void) colorStruct3;
}