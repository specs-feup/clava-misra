int v1;
void f1 ( void )
{
int a[ 2 ] = { v1, 0 };
}
int x = 0u;
extern void p ( int a[ 2 ] );
void h1 ( void )
{
/* Non-compliant - two side effects */
p ( ( int[ 2 ] ) { x, x } );
}

void foo1() {
    unsigned u8a, u8b;
    int a[4], x, y, s;
    u8a = ( 1u == 1u ) ? 0u : u8b;
    u8b++;
    s = sizeof ( 5 ); 
    a[ x ] = a[ x = y ];
    if ( ( x == 0u ) || ( v1 == 1u ) )
{
}
}