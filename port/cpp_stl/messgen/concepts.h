#pragma once

#include <concepts>
#include <cstddef>
#include <cstdint>
#include <type_traits>

namespace messgen {

template <class Msg>
concept serializable = requires(std::remove_cvref_t<Msg> msg, uint8_t *buf) {
    { msg.serialized_size() } -> std::same_as<size_t>;
    { msg.serialize(buf) } -> std::same_as<size_t>;
    { msg.deserialize(buf) } -> std::same_as<size_t>;
};

template <class Msg>
concept type = serializable<Msg> && requires(std::remove_cvref_t<Msg> msg) {
    { msg.NAME } -> std::convertible_to<const char *>;
    { msg.SCHEMA } -> std::convertible_to<const char *>;
    { msg.IS_FLAT } -> std::convertible_to<bool>;
};

template <class Msg>
concept flat_type = type<Msg> && std::remove_cvref_t<Msg>::IS_FLAT;

} // namespace messgen