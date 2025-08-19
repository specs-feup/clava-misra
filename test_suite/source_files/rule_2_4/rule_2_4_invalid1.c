enum MyEnum { 
    RED, GREEN, BLUE 
};

enum EnumForCast1 {
    RED2, GREEN2, BLUE2
};

enum EnumForCast2 {
    RED3, GREEN3, BLUE3
};

enum MyEnum2 {
    RED4, GREEN4, BLUE4
};

enum EnumForPtr {
    RED5, GREEN5, BLUE5
};

enum EnumForArray {
    RED6, GREEN6, BLUE6
};

enum UnusedEnum { /* Violation of rule 2.4 */
    RED7, GREEN7, BLUE7
};

static void enumAsParam(enum MyEnum color) {
    int var_i;
    if (color == RED) {
        var_i = 1;
    }
}

static enum EnumForCast1 enumAsReturn() {
    return (enum EnumForCast1) RED2;
};

static enum EnumForCast2 enumAsReturn2() {
    int id = 2;
    return (enum EnumForCast2) id;
};

static enum MyEnum2 color_enum = RED4;

static enum EnumForPtr *colorPtr;

static enum EnumForArray colorArray[3];