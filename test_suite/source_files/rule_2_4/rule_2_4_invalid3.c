struct MyStruct {
    int x;
    float y;
};

struct StructForReturn1 {
    int x;
    float y;
};

struct MyStruct2 {
    int x;
    float y;
};

struct StructForPtr {
    int x;
    float y;
};

struct StructForArray {
    int x;
    float y;
};

struct UnusedStruct {  /* Violation of rule 2.4 */
    int x;
    float y;
};

static void structAsParam(struct MyStruct s) {
    int xField = s.x;
}

static struct StructForReturn1 structAsReturn() {
    return (struct StructForReturn1){1, 1.5f};
}

static void use_tags_2_4_3() {
    static struct MyStruct2 myStruct = {10, 20.5f};
    static struct StructForPtr *structPtr;
    static struct StructForArray structArray[3];

    (void) myStruct;
    (void) structPtr;
    (void) structArray;
}
