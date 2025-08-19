union MyUnion {
    int x;
    float y;
};

union UnionForReturn1 {
    int x;
    float y;
};

union MyUnion2 {
    int x;
    float y;
};

union UnionForPtr {
    int x;
    float y;
};

union UnionForArray {
    int x;
    float y;
};

union UnusedUnion { /* Violation of rule 2.4 */
    int x;
    float y;
};

static void unionAsParam(union MyUnion u) {
    int xField = u.x;
}

static union UnionForReturn1 unionAsReturn() {
    return (union UnionForReturn1){.x = 1};
}

static union MyUnion2 myUnion = {.y = 20.5f};
static union UnionForPtr *unionPtr;
static union UnionForArray unionArray[3];