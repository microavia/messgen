#include "embedded_message_d1.h"

namespace messgen {
namespace msgs {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {&messgen::msgs::messgen_test::simple_message::METADATA, &messgen::msgs::messgen_test::simple_message::METADATA, nullptr};
const messgen::Metadata embedded_message_d1::METADATA =  {
    "embedded_message_d1",
    "uint64_t[5] f2;uint8_t[10] f0;simple_message[2] f1;simple_message f3;",
    nested_msgs
};

} // messgen
} // msgs
} // messgen_test

