void badComposites() {
    unsigned short u16a,u16b,u16c;
    unsigned long u32a,u32b;
    signed long s32a,s32b;

    u32a = u16a + u16b; /* Implicit conversion on assignment */
    ( unsigned short ) ( s32a + s32b );
    //( unsigned long ) ( u16a + u16b ); WIDTH PROBLEMS
}