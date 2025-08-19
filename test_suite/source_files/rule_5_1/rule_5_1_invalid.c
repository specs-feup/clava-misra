#include <stdint.h>

/*      1234567890123456789012345678901********* Characters */
int32_t engine_exhaust_gas_temperature_raw;
int32_t engine_exhaust_gas_temperature_scaled; /* Violation of rule 5.1 */

/*      1234567890123456789012345678901********* Characters */
int32_t engine_exhaust_gas_temp_raw;
int32_t engine_exhaust_gas_temp_scaled; /* Compliant */

/*   1234567890123456789012345678901********* Characters */
void motor_controller_status_update_v1(void) {
    return;
}

/*   1234567890123456789012345678901********* Characters */
void motor_controller_status_update_v2(void) { /*  Violation of rule 5.1 */
    return;
}

/*      1234567890123456789012345678901********* Characters */
int32_t data_collection_handler_buffer_var;

/*   1234567890123456789012345678901********* Characters */
void data_collection_handler_buffer_function(void) { /* Violation of rule 5.1 */
    return;
}