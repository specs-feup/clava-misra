void use_uint32(unsigned int a) {
    return;
}

void use_uint16(unsigned short a) {
    return;
}

unsigned char foo1 ( unsigned int x )
{
return x; /* uint16_t to uint8_t */
}

void badAssignments() {
    char cha;
    unsigned u8b, u8c;
    int s32a;
    short u16a;
    long u32a;

    unsigned u8a = 1.0f; /* unsigned and floating */
    bool bla = 0; /* boolean and signed */
    cha = 7; /* character and signed */
    u8a = 'a'; /* unsigned and character */
    u8b = 1 - 2; /* unsigned and signed */
    //u8c += 'a'; /* u8c = u8c + 'a' assigns character to unsigned */
    use_uint32 ( s32a ); /* signed and unsigned */
    //s8a = K2; /* Constant value does not fit */
    u16a = u32a; /* uint32_t to uint16_t */
    use_uint16 ( u32a ); /* uint32_t to uint16_t */
}