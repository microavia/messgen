#pragma once

#include "Allocator.h"

#include <concepts>
#include <cstddef>
#include <cstdint>
#include <type_traits>

namespace messgen {

template <class Type>
concept serializable = requires(std::remove_cvref_t<Type> msg, uint8_t *buf, Allocator &allocator) {
    { msg.serialized_size() } -> std::same_as<size_t>;
    { msg.serialize(buf) } -> std::same_as<size_t>;
    { msg.deserialize(buf, allocator) } -> std::same_as<size_t>;
};

template <class Type>
concept type = serializable<Type> && requires(std::remove_cvref_t<Type> msg) {
    { msg.NAME } -> std::convertible_to<const char *>;
    { msg.SCHEMA } -> std::convertible_to<const char *>;
    { msg.IS_FLAT } -> std::convertible_to<bool>;
};

template <class Type>
concept flat_type = type<Type> && std::remove_cvref_t<Type>::IS_FLAT;

template <class Message>
concept message = type<typename std::remove_cvref_t<Message>::data_type> && requires(std::remove_cvref_t<Message> msg) {
    { msg.PROTO_ID } -> std::convertible_to<int>;
    { msg.MESSAGE_ID } -> std::convertible_to<int>;
};

} // namespace messgen