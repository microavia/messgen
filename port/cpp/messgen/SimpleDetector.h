#pragma once

#include <cstddef>
#include <type_traits>

namespace messgen {

template<typename T>
struct SimpleDetector {
    static const bool is_simple_enough = std::is_integral<T>::value || std::is_floating_point<T>::value;
};

template<typename T>
struct SimpleDetector<T[]> {
    static const bool is_simple_enough = std::is_integral<T>::value || std::is_floating_point<T>::value;
};

template<typename T, size_t N>
struct SimpleDetector<T[N]> {
    static const bool is_simple_enough = std::is_integral<T>::value || std::is_floating_point<T>::value;
};

}