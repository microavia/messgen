#pragma once

#include "Allocator.h"

#include <vector>
#include <string>

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
                       // a penalty on compile time

template <class T>
constexpr reflect_t<T> reflect_type = {};

template <class T>
constexpr reflect_t<std::remove_cvref_t<T>> reflect_object(T &&t) {
    return &t;
}

template <class C, class M>
struct member {
    using class_type = C;
    using member_type = std::remove_cvref_t<M>;

    const char *name;
    M C::*ptr;
};

template <class S, class C, class M>
    requires std::same_as<std::remove_cvref_t<S>, std::remove_cvref_t<C>>
constexpr decltype(auto) value_of(S &&obj, const member<C, M> &m) {
    return std::forward<S>(obj).*m.ptr;
}

template <class C, class M>
constexpr auto parent_of(const member<C, M> &) {
    return reflect_type<typename member<C, M>::class_type>;
}

template <class C, class M>
constexpr auto type_of(const member<C, M> &) {
    return reflect_type<typename member<C, M>::member_type>;
}

template <class C, class M>
constexpr const char *name_of(const member<C, M> &m) {
    return m.name;
}

template <class T>
    requires requires(T &&t) {
        { t.NAME };
    }
constexpr const char *name_of(reflect_t<T>) {
    return T::NAME;
}

constexpr const char *name_of(reflect_t<bool>) {
    return "bool";
}

constexpr const char *name_of(reflect_t<uint8_t>) {
    return "uint8_t";
}

constexpr const char *name_of(reflect_t<int8_t>) {
    return "int8_t";
}

constexpr const char *name_of(reflect_t<uint16_t>) {
    return "uint16_t";
}

constexpr const char *name_of(reflect_t<int16_t>) {
    return "int16_t";
}

constexpr const char *name_of(reflect_t<uint32_t>) {
    return "uint32_t";
}

constexpr const char *name_of(reflect_t<int32_t>) {
    return "int32_t";
}

constexpr const char *name_of(reflect_t<uint64_t>) {
    return "uint64_t";
}

constexpr const char *name_of(reflect_t<int64_t>) {
    return "int64_t";
}

constexpr const char *name_of(reflect_t<float>) {
    return "float";
}

constexpr const char *name_of(reflect_t<double>) {
    return "double";
}

constexpr const char *name_of(reflect_t<std::string>) {
    return "string";
}

template <class T>
const char *name_of(reflect_t<std::vector<T>>) {
    static auto name = "vector<" + std::string(name_of(reflect_type<T>)) + ">";
    return name.c_str();
}

using size_type = uint32_t;

template <class T>
struct vector {
    T *_ptr = nullptr;
    size_t _size = 0;

    vector() = default;

    vector(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
    }

    vector(T *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    vector(const T *ptr, size_t size)
        : _ptr(const_cast<T *>(ptr)),
          _size(size) {
    }

    vector(std::vector<T> &v)
        : _ptr(v.begin().base()),
          _size(v.size()) {
    }

    vector(const std::vector<T> &v)
        : _ptr(const_cast<T *>(v.begin().base())),
          _size(v.size()) {
    }

    vector<T> &operator=(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
        return *this;
    }

    size_t size() const {
        return _size;
    }

    T *begin() {
        return _ptr;
    }

    const T *begin() const {
        return _ptr;
    }

    T *end() {
        return _ptr + _size;
    }

    const T *end() const {
        return _ptr + _size;
    }

    bool operator==(const vector<T> &other) const {
        if (_size != other._size) {
            return false;
        }

        for (size_t i = 0; i < _size; ++i) {
            if (_ptr[i] != other._ptr[i]) {
                return false;
            }
        }

        return true;
    }

    T &operator[](size_t idx) {
        return _ptr[idx];
    }

    const T &operator[](size_t idx) const {
        return _ptr[idx];
    }
};

} // namespace messgen
