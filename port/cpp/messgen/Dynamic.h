#pragma once

#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <memory>
#include <type_traits>

namespace messgen {

template<class T>
struct Dynamic {
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

    T &operator[](uint32_t idx) {
        return ptr[idx];
    }

    const T &operator[](uint32_t idx) const {
        return ptr[idx];
    }
};

template <class T, size_t N>
inline Dynamic<T> make_dynamic(const T (&arr)[N]) {
    return Dynamic<T>{.ptr = const_cast<T*>(arr), .size = N};
}

}
