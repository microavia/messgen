#pragma once

#include <cstdint>
#include <cstring>
#include "MemoryAllocator.h"
#include "SimpleDetector.h"

namespace messgen {
namespace detail {

template<typename T, bool Simple = SimpleDetector<T>::is_simple_enough>
struct Parser;

template<typename T>
struct Parser<T, true> {
    static int parse(const uint8_t* buf, uint16_t len, MemoryAllocator&, T& value) {
        int bytes = sizeof(T);
        if (len < bytes) { return -1; }
        std::memcpy(&value, buf, bytes);
        return bytes;
    }
};

template<typename T>
struct Parser<T, false> {
    static int parse(const uint8_t* buf, uint16_t len, MemoryAllocator& allocator, T& value) {
        const uint8_t* src = buf;
        auto dyn_parsed_len = value.parse_msg(src, len, allocator);
        if (dyn_parsed_len < 0) { return -1; }
        src += dyn_parsed_len;
        len -= dyn_parsed_len;

        return src - buf;
    }
};

}

template<typename T>
struct Parser {
    static int parse(const uint8_t *buf, uint16_t len, MemoryAllocator & allocator, T& value) {
        return detail::Parser<T>::parse(buf, len, allocator, value);
    }
};

}