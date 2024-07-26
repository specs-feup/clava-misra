void use_uint16(unsigned int a) {
    return;
}

void goodAssignments() {
    unsigned char u8b, u8c, u8d;
    enum ena {R,G,B} ena;
    enum {A1, K1};
    int s8a;
    char cha;

    unsigned int u8a = 0; /* By exception */
    bool flag = ( bool ) 0;
    bool set = true; /* true is essentially Boolean */
    bool get = ( u8b > u8c );
    s8a = K1; /* Constant value fits */
    u8a = 2; /* By exception */
    //u8a = 2 * 24; /* By exception */ <-- DO THIS WHEN ISINTEGERCONSTANTEXPR IS AVAILABLE
    u8a = ( unsigned int ) s8a; /* Cast gives same essential type */

    unsigned int u32a;
    unsigned char u16a, u16b;
    u32a = u16a; /* Assignment to a wider essential type */
    u32a = 2U + 125U; /* Assignment to a wider essential type */
    use_uint16 ( u8a ); /* Assignment to a wider essential type */
    use_uint16 ( u8a + u16b ); /* Assignment to same essential type */
}