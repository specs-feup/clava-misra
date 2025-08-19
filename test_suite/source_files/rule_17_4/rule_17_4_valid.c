static unsigned int test_17_4_1() {
    return 0;  
}

static int test_17_4_2(int w) {
    if (w > 20) {
        return 0;
    } else {
        return 1;
    }
}

static int test_17_4_3(int w) {
    if (w > 0) {
        if (w < 5) {
            return 4;
        } else {
            return 5;
        }
    } else {
        if (w == 0) {
            return 0;
        } else {
            return 0;
        }
    }
}