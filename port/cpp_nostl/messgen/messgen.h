#pragma once

#include "Allocator.h"
#include "concepts.h"

#include <vector>
#include <string>

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
                       // a penalty on compile time

template <class T>
using splice_t = std::remove_pointer_t<T>;

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
};

template <class C, class M>
struct member_variable : member<C, M> {
    using member<C, M>::name;
    M C::*ptr;
};

template <class C, class M>
member_variable(const char *, M C::*) -> member_variable<C, M>;

template <class S, class C, class M>
    requires std::same_as<std::remove_cvref_t<S>, std::remove_cvref_t<C>>
[[nodiscard]] constexpr decltype(auto) value_of(S &&obj, const member_variable<C, M> &m) noexcept {
    return std::forward<S>(obj).*m.ptr;
}

template <class C, class M>
[[nodiscard]] constexpr auto parent_of(const member<C, M> &) noexcept {
    return reflect_type<typename member<C, M>::class_type>;
}

template <class C, class M>
[[nodiscard]] constexpr auto type_of(const member<C, M> &) noexcept {
    return reflect_type<typename member<C, M>::member_type>;
}

template <class C, class M>
[[nodiscard]] constexpr std::string_view name_of(const member<C, M> &m) noexcept {
    return m.name;
}

template <class T>
    requires requires(T &&t) {
        { t.NAME };
    }
[[nodiscard]] constexpr std::string_view name_of(reflect_t<T>) noexcept {
    return T::NAME;
}

template <class T>
    requires std::is_enum_v<T>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<T> r) noexcept {
    return name_of(r);
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<bool>) noexcept {
    return "bool";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint8_t>) noexcept {
    return "uint8_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int8_t>) noexcept {
    return "int8_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint16_t>) noexcept {
    return "uint16_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int16_t>) noexcept {
    return "int16_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint32_t>) noexcept {
    return "uint32_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int32_t>) noexcept {
    return "int32_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint64_t>) noexcept {
    return "uint64_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int64_t>) noexcept {
    return "int64_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<float>) noexcept {
    return "float";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<double>) noexcept {
    return "double";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept {
    return "string";
}

template <class T>
[[nodiscard]] std::string_view name_of(reflect_t<std::vector<T>>) {
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

    T *data() {
        return _ptr;
    }

    const T *data() const {
        return _ptr;
    }
};

} // namespace messgen
