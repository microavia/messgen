#pragma once

#include "messgen.h"
#include <vector>
#include <array>


namespace messgen {

class DynamicMemoryAllocator {
public:
    explicit DynamicMemoryAllocator(size_t size) :
        _memory(size),
        _alloc(&_memory[0], _memory.size()) {}

    operator MemoryAllocator& () noexcept {
        _alloc = MemoryAllocator(&_memory[0], _memory.size());
        return _alloc;
    }

private:
    std::vector<uint8_t> _memory;
    MemoryAllocator _alloc;
};

template <size_t MEM_SIZE>
class StaticMemoryAllocator {
public:
    explicit StaticMemoryAllocator() noexcept :
            _alloc(_memory.begin(), _memory.size()) {}

    operator MemoryAllocator &() noexcept {
        _alloc = MemoryAllocator(_memory.begin(), _memory.size());
        return _alloc;
    }

private:
    std::array<uint8_t, MEM_SIZE> _memory{};
    MemoryAllocator _alloc;
};

template <class T>
size_t serialize(const T &msg, std::vector<uint8_t> & buf) {
    const size_t initial_size = buf.size();
    const size_t serialized_size = get_serialized_size(msg);

    buf.resize(initial_size + serialized_size);
    return serialize(msg, &buf[initial_size], serialized_size);
}

int get_message_info(const std::vector<uint8_t> & buf, MessageInfo &info) {
    return get_message_info(&buf[0], buf.size(), info);
}

template <class F>
size_t for_each_message(const std::vector<uint8_t> &payload, F f) {
    return for_each_message(&payload[0], payload.size(), f);
}

template <class T>
Dynamic<T> make_dynamic(std::vector<T> & vec) {
    return Dynamic<T>{&vec[0], vec.size()};
}

}