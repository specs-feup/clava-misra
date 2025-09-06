/* Should be removed */
typedef enum {  /* Violation of rule 2.3 */
    A1,
    B1,
    C1
} MyUnusedEnum;

/* Should be removed */
typedef enum ColorEnum2_3 {  /* Violation of rule 2.3, 2.4 */
    YELLOW,
    BROWN,
    WHITE
} Color2;

/* Should be replaced by the enum */
typedef enum ColorEnum {  /*  Violation of rule 2.3 */
    RED,
    GREEN,
    BLUE
} RGB_Color;

static void use_color_enum() {
    enum ColorEnum colorInstance = GREEN;  
    (void) colorInstance;
}