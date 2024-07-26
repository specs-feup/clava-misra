void goodCasts() {
    enum enuma {R,G,B} ena;
    enum enumc {C,M,Y} enc;

    ( bool ) false; /* Compliant - 'false' is essentially Boolean */
    ( int ) 3U; /* Compliant */
    ( bool ) 0; /* Compliant - by exception */
    //( bool ) 3U; /* Non-compliant */
    ( int ) ena; /* Compliant */
    //( enum enuma ) 3; /* Non-compliant */
    ( char ) enc; /* Compliant */
}