#pragma once

#include "messgen_def.h"

#include <cstring>
#include <cassert>
#include <new>

namespace messgen {

struct inplace_payload {
    using value_type = uint8_t;
    using size_type = messgen::size_type;
    using difference_type = std::ptrdiff_t;
    using reference = value_type &;
    using const_reference = const value_type &;
    using pointer = value_type *;
    using const_pointer = const value_type *;
    using iterator = value_type *;
    using const_iterator = const value_type *;
    using reverse_iterator = value_type *;
    using const_reverse_iterator = const value_type *;

    inplace_payload() = default;

    inplace_payload(messgen::size_type size)
        : _size(size) {
    }

    ~inplace_payload() = delete; // prevent stack allocation

    inplace_payload(inplace_payload &&other) = delete;
    inplace_payload(const inplace_payload &other) = delete;

    inplace_payload &operator=(const inplace_payload &other) {
        this->assign(other.begin(), other.end());
        return *this;
    }

    void *operator new(size_t, void *mem) {
        return ::new (mem) inplace_payload();
    }

    void *operator new(size_t) = delete; // prevent non-placement new

    void operator delete(void *ptr) noexcept = delete;

    bool operator==(const inplace_payload &other) const {
        return _size == other._size && std::memcmp(data(), other.data(), _size) == 0;
    }

    bool operator!=(const inplace_payload &other) const {
        return !(*this == other);
    }

    messgen::size_type size() const {
        return _size;
    }

    uint8_t *data() {
        return reinterpret_cast<uint8_t *>(this) + sizeof(inplace_payload);
    }

    const uint8_t *data() const {
        return reinterpret_cast<const uint8_t *>(this) + sizeof(inplace_payload);
    }

    uint8_t *begin() {
        return data();
    }

    const uint8_t *begin() const {
        return data();
    }

    uint8_t *end() {
        return data() + _size;
    }

    const uint8_t *end() const {
        return data() + _size;
    }

    void assign(const uint8_t *begin, const uint8_t *end) {
        assert(begin < end);
        _size = end - begin;
        std::memcpy(data(), begin, _size);
    }

private:
    messgen::size_type _size = 0;
};

} // namespace messgen
