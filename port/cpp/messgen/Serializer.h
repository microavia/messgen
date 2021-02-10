#pragma once

#include <cstdint>
#include <cstring>
#include "MemoryAllocator.h"
#include "SimpleDetector.h"

namespace messgen {
namespace detail {

template<typename T, bool Simple = SimpleDetector<T>::is_simple_enough>
struct Serializer;

template<typename T>
struct Serializer<T, true> {
    static size_t serialize(uint8_t *buf, const T &value) {
        auto bytes = sizeof(T);
        std::memcpy(buf, &value, bytes);
        return bytes;
    }

    static size_t get_dynamic_size(const T&) {
        return 0;
    }
};

template<typename T>
struct Serializer<T, false> {
    static size_t serialize(uint8_t *buf, const T &value) {
        return value.serialize_msg(buf);
    }

    static size_t get_dynamic_size(const T& value) {
        return value.get_dynamic_size();
    }
};

}

template<typename T>
struct Serializer {
    static size_t serialize(uint8_t *buf, const T &value) {
        return detail::Serializer<T>::serialize(buf, value);
    }

    static size_t get_dynamic_size(const T& value) {
        return detail::Serializer<T>::get_dynamic_size(value);
    }
};

}