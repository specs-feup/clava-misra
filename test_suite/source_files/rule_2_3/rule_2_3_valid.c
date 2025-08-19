typedef int MyInt;
typedef MyInt AliasInt;

typedef int BasicInt;
typedef BasicInt* PtrToBasicInt;

typedef int MyInt2;
typedef int MyInt3;
typedef int MyInt4;

typedef struct {
    int x;
    int y; 
    MyInt2 i2;       
    MyInt3 i3[4];  
    MyInt4 *i4;   
} MyStruct4;

typedef int MyInt5;
typedef union {
    int x;
    int y; 
    MyInt5 i5;
} MyUnion3;

typedef int BasicInt2;
static void foo(BasicInt2 x) {
    int var_2_3 = x + 1;
}

typedef int BasicInt3;
static BasicInt3 bar() {
    return (BasicInt3)10;
}

static int test_2_3_1() {
    AliasInt aInt = 1;
    BasicInt x = 10;
    MyInt4 y = 11;

    MyStruct4 myStructInstance = {1, 2, 3, {4, 5, 6, 7}, &y};

    MyUnion3 myUnionInstance;
    myUnionInstance.x = 100;

    PtrToBasicInt ptr = &x;

    return 0;
}