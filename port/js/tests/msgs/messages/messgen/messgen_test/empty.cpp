#include "empty.h"

namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

static const messgen::Metadata *nested_msgs[] = {nullptr};
const messgen::Metadata empty::METADATA =  {
    "empty",
    "",
    nested_msgs
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

