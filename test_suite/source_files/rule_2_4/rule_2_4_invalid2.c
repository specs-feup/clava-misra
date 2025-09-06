typedef enum {
    A1,
    B1,
    C1
} ColorEnum2;

typedef enum MyColors {
    A2,
    B3,
    C4
} ColorOption;

typedef enum MyColors2 {  /* Violation of rule 2.4 */
    A5,
    B6,
    C7
} ColorOption2;

static void use_tags_2_4_2() {
    enum MyColors my_color = A2;
    ColorOption color_option = B3;
    ColorEnum2 colorEnum2 = A1;
    ColorOption2 color2 = B6;

    (void) my_color;
    (void) color_option;
    (void) colorEnum2;
    (void) color2;
}