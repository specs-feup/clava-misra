#include "lib.h"

int main(int argc, char *argv[]) {
    int x, y;

   switch (x) {
      case 1:
      case 2:
      //default:
         y = 2;
         break;
      case 4:
         y = 3;
         break;
   }
   switch (x) {
      case 1:
      case 2:
      default:
         y = 2;
      case 4:
         y = 3;
         break;
   }
    return 0;
}