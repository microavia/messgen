#include "embedded_message_d1.h"

namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {&.::msgs::messages::messgen::messgen_test::simple_message::METADATA, &.::msgs::messages::messgen::messgen_test::simple_message::METADATA, nullptr};
const messgen::Metadata embedded_message_d1::METADATA =  {
    "embedded_message_d1",
    "uint64_t[5] f2;uint8_t[10] f0;simple_message[2] f1;simple_message f3;",
    nested_msgs
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

