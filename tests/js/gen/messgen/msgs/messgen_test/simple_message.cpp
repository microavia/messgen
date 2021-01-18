#include "simple_message.h"

namespace messgen {
namespace msgs {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {nullptr};
const messgen::Metadata simple_message::METADATA =  {
    "simple_message",
    "uint64_t f0;int64_t f1;double f2;uint32_t f3;int32_t f4;float f5;uint16_t f6;int16_t f7;uint8_t f8;int8_t f9;",
    nested_msgs
};

} // messgen
} // msgs
} // messgen_test

