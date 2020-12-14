#include "existing.h"

namespace super::duper::project {

static const messgen::Metadata *nested_msgs[] = {nullptr};
const messgen::Metadata existing::METADATA = {
        "Existing",
        "int data;",
        nested_msgs
};

}