void f ( void )
{
int j = 0;
L1:
++j;
if ( 10 == j )
{
goto L2; /* Compliant */
}
goto L1; /* Non-compliant */
L2 :
++j;
}

void f1 ( int a )
{
if ( a <= 0 )
{
goto L2; /* Non-compliant */
}
goto L1; /* Compliant */
if ( a == 0 )
{
goto L1; /* Compliant */
}
goto L2; /* Non-compliant */
L1:
if ( a > 0 )
{
L2:
;
}
}

void f2() {
   int x,y,z;
   while ( x != 0u )
{
x = 5;
if ( x == 1u )
{
break;
}
while ( y != 0u )
{
y = 6;
if ( y == 1u )
{
goto L1;
}
}
}
L1:
z = x + y;
}

int main(int argc, char *argv[]) {


    return 0;
}