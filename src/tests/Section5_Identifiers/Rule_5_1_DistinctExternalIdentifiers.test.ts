import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const failingCode = `
#include <stdint.h>

/*      1234567890123456789012345678901********* Characters */
int32_t engine_exhaust_gas_temperature_raw;
int32_t engine_exhaust_gas_temperature_scaled; /* Non-compliant */

/*      1234567890123456789012345678901********* Characters */
int32_t engine_exhaust_gas_temp_raw;
int32_t engine_exhaust_gas_temp_scaled; /* Compliant */

/*   1234567890123456789012345678901********* Characters */
void motor_controller_status_update_v1(void) {
    return;
}

/*   1234567890123456789012345678901********* Characters */
void motor_controller_status_update_v2(void) { /* Non-compliant */
    return;
}

/*      1234567890123456789012345678901********* Characters */
int32_t data_collection_handler_buffer_var;

/*   1234567890123456789012345678901********* Characters */
void data_collection_handler_buffer_function(void) { /* Non-compliant */
    return;
}
`;

const systemFile = `
#include <stdint.h>

extern int32_t engine_exhaust_gas_temperature_raw;
extern int32_t engine_exhaust_gas_temperature_scaled; 

extern int32_t engine_exhaust_gas_temp_raw;
extern int32_t engine_exhaust_gas_temp_scaled;

extern void motor_controller_status_update_v1(void);
extern void motor_controller_status_update_v2(void);

extern int32_t data_collection_handler_buffer_var;
extern void data_collection_handler_buffer_function(void);
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "system.c", code: systemFile }
];

describe("Rule 5.1", () => {
    registerSourceCode(files);

    it("should detect violations of Rule 5.1", () => {
        expect(countMISRAErrors()).toBe(3);
        expect(countMISRAErrors("5.1")).toBe(3);
    });

    it("should correct all violations of Rule 5.1", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
