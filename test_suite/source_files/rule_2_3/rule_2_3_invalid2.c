/* Should be removed */
typedef struct { /* Violation of rule 2.3 */
    int x;
    int y; 
} MyUnusedStruct;

/* Should be removed */
typedef struct NumberEnum {  /* Violation of rule 2.3, 2.4 */
    int x;
    int y; 
} MyUnusedStruct2;

/* Should be replaced by the struct */
typedef struct PersonStruct {  /* Violation of rule 2.3 */
    int id;
    char name[10];
} Person;

static struct PersonStruct personInstance = {1, "Alice"};

static void use_person_struct(struct PersonStruct param) {
    (void) (param.id);
}