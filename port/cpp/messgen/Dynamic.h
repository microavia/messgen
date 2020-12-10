#pragma once

#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <memory>
#include <type_traits>

#include "MemoryAllocator.h"

namespace messgen {

template<typename T>
struct SimpleDetector {
    static const bool is_simple_enough = std::is_integral<T>::value;
};

template<class T, bool SIMPLE = SimpleDetector<T>::is_simple_enough>
struct Dynamic {
    T *ptr;
    uint16_t size;

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

        if constexpr (SIMPLE) {
            auto bytes = this->size * sizeof(T);
            std::memcpy(dst, this->ptr, bytes);
            dst += bytes;
        } else {
            for (size_t i = 0; i < this->size; ++i) {
                dst += this->ptr[i].serialize_msg(dst);
            }
        }

        return dst - buf;
    }

    size_t parse_msg(const uint8_t *buf, uint16_t len, messgen::MemoryAllocator & allocator) {
        const uint8_t* src = buf;

        if (len < sizeof(this->size)) { return 0; }

        memcpy(std::addressof(this->size), src, sizeof(this->size));
        src += sizeof(this->size);
        len -= sizeof(this->size);

        this->ptr = allocator.alloc<T>(this->size);
        if (nullptr == this->ptr) { return 0; }

        if constexpr (SIMPLE) {
            auto bytes = this->size * sizeof(T);
            memcpy(this->ptr, src, bytes);
            src += bytes;
        } else {
            for (size_t i = 0; i < this->size; ++i) {
                auto dyn_parsed_len = this->ptr[i].parse_msg(src, len, allocator);
                if (dyn_parsed_len == 0) {
                    return 0;
                }
                src += dyn_parsed_len;
                len -= dyn_parsed_len;
            }
        }

        return src - buf;
    }

    T &operator[](uint16_t idx) {
        return ptr[idx];
    }

    const T &operator[](uint16_t idx) const {
        return ptr[idx];
    }
};

}
