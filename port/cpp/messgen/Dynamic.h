#pragma once

#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <memory>
#include <type_traits>

#include "MemoryAllocator.h"
#include "SimpleDetector.h"

namespace messgen {

template<typename T, bool S>
struct Dynamic;

namespace dynamic {
namespace detail {

template<typename T>
struct Serializer;

template<typename T>
struct Serializer<Dynamic<T, true>> {
    static size_t serialize(uint8_t* buf, const Dynamic<T, true>& dynamic) {
        auto bytes = dynamic.size * sizeof(T);
        std::memcpy(buf, dynamic.ptr, bytes);
        return bytes;
    }
};

template<typename T>
struct Serializer<Dynamic<T, false>> {
    static size_t serialize(uint8_t* buf, const Dynamic<T, false>& dynamic) {
        uint8_t* dst = buf;
        for (size_t i = 0; i < dynamic.size; ++i) {
            dst += dynamic.ptr[i].serialize_msg(dst);
        }
        return dst - buf;
    }
};

template<typename T>
struct Parser;

template<typename T>
struct Parser<Dynamic<T, true>> {
    static size_t parse(const uint8_t* buf, uint32_t, MemoryAllocator&, Dynamic<T, true>& dynamic) {
        auto bytes = dynamic.size * sizeof(T);
        memcpy(dynamic.ptr, buf, bytes);
        return bytes;
    }
};

template<typename T>
struct Parser<Dynamic<T, false>> {
    static int parse(const uint8_t* buf, uint32_t len, MemoryAllocator& allocator, Dynamic<T, false>& dynamic) {
        const uint8_t *src = buf;
        for (size_t i = 0; i < dynamic.size; ++i) {
            auto dyn_parsed_len = dynamic.ptr[i].parse_msg(src, len, allocator);
            if (dyn_parsed_len < 0) {
                return -1;
            }
            src += dyn_parsed_len;
            len -= dyn_parsed_len;
        }

        return src - buf;
    }
};

}
}

template<class T, bool SIMPLE = SimpleDetector<T>::is_simple_enough>
struct Dynamic {
    using this_type = Dynamic<T, SIMPLE>;

    T *ptr;
    uint32_t size;

    bool operator==(const Dynamic<T> &other) const {
        if (size != other.size) {
            return false;
        }

        for (size_t i = 0; i < size; ++i) {
            if (ptr[i] != other.ptr[i]) {
                return false;
            }
        }

        return true;
    }

    size_t serialize_msg(uint8_t *buf) const {
        uint8_t* dst = buf;

        std::memcpy(dst, std::addressof(this->size), sizeof(this->size));
        dst += sizeof(this->size);

        dst += dynamic::detail::Serializer<this_type>::serialize(dst, *this);

        return dst - buf;
    }

    int parse_msg(const uint8_t *buf, uint32_t len, MemoryAllocator & allocator) {
        const uint8_t* src = buf;

        if (len < sizeof(this->size)) { return -1; }

        std::memcpy(std::addressof(this->size), src, sizeof(this->size));
        src += sizeof(this->size);
        len -= sizeof(this->size);

        this->ptr = allocator.alloc<T>(this->size);
        if (nullptr == this->ptr) { return -1; }

        int res = dynamic::detail::Parser<this_type>::parse(src, len, allocator, *this);
        if (res < 0) {
            return -1;
        }

        src += res;
        return src - buf;
    }

    T &operator[](uint32_t idx) {
        return ptr[idx];
    }

    const T &operator[](uint32_t idx) const {
        return ptr[idx];
    }
};

}
