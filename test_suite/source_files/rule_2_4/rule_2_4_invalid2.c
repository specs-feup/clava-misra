typedef enum {
    A1,
    B1,
    C1
} ColorEnum2;
static ColorEnum2 colorEnum2 = A1;

typedef enum MyColors {
    A2,
    B3,
    C4
} ColorOption;
static enum MyColors my_color = A2;
static ColorOption color_option = B3;

typedef enum MyColors2 {  /* Violation of rule 2.4 */
    A5,
    B6,
    C7
} ColorOption2;
static ColorOption2 color2 = B6;