typedef struct {
    int x;
    float y;
} ColorStruct;
static ColorStruct colorStruct = {1, 2.5};

typedef struct MyStruct5 {
    int x;
    float y;
} ColorStruct2;
static struct MyStruct5 struct5 = {2, 4.5};
static ColorStruct2 colorStruct2 = {1, 2.5};

typedef struct MyStruct3 { /* Violation of rule 2.4 */
    int x;
    float y;
} ColorStruct3;
static ColorStruct3 colorStruct3 = {10, 5.5};