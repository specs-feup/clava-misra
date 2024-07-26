struct s
{
unsigned short len;
unsigned int data[ 6 ]; 
} str;

void f ( void )
{
    int n = 5;
    typedef int Vector[ 5 ]; /* An array type with 5 elements */
    n = 7;
    Vector a1; /* An array type with 5 elements */
    int a2[ 7 ]; /* An array type with 7 elements */
}