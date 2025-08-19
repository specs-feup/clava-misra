#include <stdint.h>

extern int32_t engine_exhaust_gas_temperature_raw;
extern int32_t engine_exhaust_gas_temperature_scaled; 

extern int32_t engine_exhaust_gas_temp_raw;
extern int32_t engine_exhaust_gas_temp_scaled;

extern void motor_controller_status_update_v1(void);
extern void motor_controller_status_update_v2(void);

extern int32_t data_collection_handler_buffer_var;
extern void data_collection_handler_buffer_function(void);

static void use_externs_5_1() {
    (void) (engine_exhaust_gas_temperature_raw);
    (void) (engine_exhaust_gas_temperature_scaled);
    (void) (engine_exhaust_gas_temp_raw);
    (void) (engine_exhaust_gas_temp_scaled);
    motor_controller_status_update_v1();
    motor_controller_status_update_v2();

    (void) (data_collection_handler_buffer_var);

    data_collection_handler_buffer_function();
}