#include "empty.h"

namespace messgen {
namespace msgs {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {nullptr};
const messgen::Metadata empty::METADATA =  {
    "empty",
    "",
    nested_msgs
};

} // messgen
} // msgs
} // messgen_test

