#include "embedded_dynamic_message_d1.h"

namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {&.::msgs::messages::messgen::messgen_test::simple_dynamic_message::METADATA, &.::msgs::messages::messgen::messgen_test::simple_dynamic_message::METADATA, &.::msgs::messages::messgen::messgen_test::simple_dynamic_message::METADATA, &.::msgs::messages::messgen::messgen_test::simple_message::METADATA, nullptr};
const messgen::Metadata embedded_dynamic_message_d1::METADATA =  {
    "embedded_dynamic_message_d1",
    "uint8_t f3;simple_dynamic_message[2] f5;simple_dynamic_message f6;uint64_t[] f0;simple_dynamic_message[] f1;simple_message[] f2;int8_t[] f4;string f7;string f8;",
    nested_msgs
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

