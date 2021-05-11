#pragma once

#include "MemoryAllocator.h"

#include <iostream>

namespace messgen {

/**
 *  @brief Class for storing objects with dynamic fields.
 *          Owns memory for dynamic allocations.
 */
template<class T>
class StorageBase {
public:
    static constexpr uint8_t TYPE = T::TYPE;
    static constexpr size_t STATIC_SIZE = T::STATIC_SIZE;
    static constexpr uint8_t PROTO = T::PROTO;
    static constexpr bool HAS_DYNAMICS = T::HAS_DYNAMICS;

    StorageBase() noexcept = default;

    virtual ~StorageBase() = default;

    explicit StorageBase(const T& value) noexcept:
            _value(value) {}

    explicit StorageBase(const T&& value) noexcept:
            _value(value) {}

    bool operator== (const T& rhs) const noexcept {
        return _value == rhs;
    }

    bool operator== (const T&& rhs) const noexcept {
        return _value == rhs;
    }

    T* operator->() noexcept {
        return &_value;
    }

    const T* operator->() const noexcept {
        return &_value;
    }

    StorageBase& operator= (const T& rhs) noexcept {
        _value = rhs;
        return *this;
    }

    StorageBase& operator= (const T&& rhs) noexcept {
        _value = rhs;
        return *this;
    }

    operator T& () noexcept {
        return _value;
    }

    operator const T& () const noexcept {
        return _value;
    }

    size_t get_size() const noexcept {
        return _value.get_size();
    }

    size_t get_dynamic_size() const noexcept {
        return _value.get_dynamic_size();
    }

    int serialize_msg(uint8_t *buf) const noexcept {
        return _value.serialize_msg(buf);
    }

protected:
    T _value;
};

template<class T, size_t SIZE=0, bool D = T::HAS_DYNAMICS>
class Storage {};

/**
 *  @brief Class for storing objects with dynamic fields.
 *          Owns memory for dynamic allocations.
 */
template <class T, size_t SIZE>
class Storage<T, SIZE, true> : public StorageBase<T> {
public:
    static_assert(SIZE != 0, "Storage size for message with dynamic fields has zero length!");

    Storage() noexcept = default;

    explicit Storage(const T& value) noexcept:
            StorageBase<T>(value) {}

    explicit Storage(const T&& value) noexcept:
            StorageBase<T>(value) {}

    int parse_msg(const uint8_t *buf, uint32_t len) noexcept {
        return this->_value.parse_msg(buf, len, _memory_allocator);
    }

private:
    StaticMemoryAllocator<SIZE> _memory_allocator;
};

/**
 *  @brief Class for storing objects with dynamic fields.
 *          Owns memory for dynamic allocations.
 */
template <class T, size_t SIZE>
class Storage<T, SIZE, false> : public StorageBase<T> {
public:
    static_assert(SIZE == 0, "Storage for message without dynamic fields has non zero length!");

    Storage() noexcept = default;

    explicit Storage(const T& value) noexcept:
            StorageBase<T>(value) {}

    explicit Storage(const T&& value) noexcept:
            StorageBase<T>(value) {}

    int parse_msg(const uint8_t *buf, uint32_t len) noexcept {
        return this->_value.parse_msg(buf, len, _memory_allocator);
    }

private:
    MemoryAllocator _memory_allocator{nullptr, 0};
};

}