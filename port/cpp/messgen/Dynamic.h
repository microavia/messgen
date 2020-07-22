#pragma once

#include <cstdint>

namespace messgen {

template<class T>
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

    T &operator[](uint16_t idx) {
        return ptr[idx];
    }

    const T &operator[](uint16_t idx) const {
        return ptr[idx];
    }
};

}
