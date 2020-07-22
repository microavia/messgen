#pragma once


namespace messgen {

struct Metadata {
    const char *name;              ///< Struct name.
    const char *fields;            ///< Fields definition.
    const Metadata **nested_msgs;  ///< Nested messages list, null-terminated.
};

}
