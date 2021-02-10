#pragma once

#include <cstddef>

#include <messgen/Metadata.h>
#include <messgen/Dynamic.h>

namespace super::duper::project {

struct existing{
    int data;

    bool operator==(const existing& other) const { return data == other.data; }

    std::size_t get_size() const { return sizeof(data); }

    static const messgen::Metadata METADATA;
};

}

namespace messgen {

template<>
struct SimpleDetector<super::duper::project::existing> {
    static const bool is_simple_enough = true;
};

} // messgen