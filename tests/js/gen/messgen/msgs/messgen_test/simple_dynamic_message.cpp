#include "simple_dynamic_message.h"

namespace messgen {
namespace msgs {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {nullptr};
const messgen::Metadata simple_dynamic_message::METADATA =  {
    "simple_dynamic_message",
    "int64_t f1;double f2;int32_t f4;float f5;uint16_t f6;int16_t f7;uint64_t[] f0;uint32_t[] f3;uint8_t[] f8;int8_t[] f9;string my_null_string;string non_null_string1;string non_null_string2;",
    nested_msgs
};

} // messgen
} // msgs
} // messgen_test

