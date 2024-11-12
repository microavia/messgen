#pragma once

#include <array>
#include <concepts>
#include <cstdint>
#include <map>
#include <string>
#include <utility>
#include <vector>

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

template <class T, auto N>
constexpr const char *name_of(reflect_t<std::array<T, N>>) {
    static auto name = "array<" + std::string(name_of(reflect_type<T>)) + ", " + std::to_string(N) + ">";
    return name.c_str();
}

template <class T>
constexpr const char *name_of(reflect_t<std::vector<T>>) {
    static auto name = "vector<" + std::string(name_of(reflect_type<T>)) + ">";
    return name.c_str();
}

template <class K, class V>
constexpr const char *name_of(reflect_t<std::map<K, V>>) {
    static auto name = "map<" + std::string(name_of(reflect_type<K>)) + "," + std::string(name_of(reflect_type<V>)) + ">";
    return name.c_str();
}

using size_type = uint32_t;

} // namespace messgen
