#pragma once

#include "messgen.h"
#include <vector>
#include <array>


namespace messgen {
namespace stl {

/**
 * @brief Class which allows to dynamically allocate memory for messgen parsing
 * @warning Each parse call on this class will clear memory, so if you want to do multiple parse calls
 *          store it into temporary MemoryAllocator& variable.
 */
class DynamicMemoryAllocator {
public:
    explicit DynamicMemoryAllocator(size_t size) :
            _memory(size),
            _alloc(&_memory[0], _memory.size()) {}

    operator MemoryAllocator &() noexcept {
        _alloc = MemoryAllocator(&_memory[0], _memory.size());
        return _alloc;
    }

private:
    std::vector<uint8_t> _memory;
    MemoryAllocator _alloc;
};

/**
 * @brief Class which allows to statically allocate memory for messgen parsing
 * @tparam MEM_SIZE     -   memory size
 * @warning Each parse call on this class will clear memory, so if you want to do multiple parse calls
 *          store it into temporary MemoryAllocator& variable.
 */
template<size_t MEM_SIZE>
class StaticMemoryAllocator {
public:
    explicit StaticMemoryAllocator() noexcept:
            _alloc(_memory.begin(), _memory.size()) {}

    operator MemoryAllocator &() noexcept {
        _alloc = MemoryAllocator(_memory.begin(), _memory.size());
        return _alloc;
    }

private:
    std::array<uint8_t, MEM_SIZE> _memory{};
    MemoryAllocator _alloc;
};

/**
 * @brief Serialize message into std::vector
 * @details This function will not write into vector more than its' capacity allows in order to avoid
 *             unexpected memory allocations
 * @tparam T    -   message type
 * @param msg   -   message instance
 * @param buf   -   vector to serialize to
 * @return  0 in case of success, -1 in case of error
 */
template<class T>
int serialize(const T &msg, std::vector<uint8_t> &buf) {
    const size_t initial_size = buf.size();
    const size_t serialized_size = get_serialized_size(msg);
    const size_t total_size = initial_size + serialized_size;

    if (buf.capacity() < total_size) {
        return -1;
    }

    buf.resize(total_size);
    int res = messgen::serialize(msg, &buf[initial_size], serialized_size);
    if (res == -1) {
        buf.resize(initial_size);
    }

    return res;
}

/**
 * @brief Parse message with std::vector as memory pool
 * @tparam T            -   message type
 * @param info          -   message info
 * @param msg           -   message to parse
 * @param memory_pool   -   memory pool
 * @return  0 in case of success, -1 in case of error
 */
template<class T>
inline int parse(const messgen::MessageInfo &info, T &msg,
                 std::vector<uint8_t> memory_pool = std::vector<uint8_t>()) {
    messgen::MemoryAllocator allocator(&memory_pool[0], memory_pool.capacity());
    return messgen::parse(info, msg, allocator);
}

/**
 * @brief Helper wrapper around std::vector. See messgen.h get_message_info().
 */
inline int get_message_info(const std::vector<uint8_t> &buf, MessageInfo &info) {
    return get_message_info(&buf[0], buf.size(), info);
}

/**
 * @brief Helper wrapper around std::vector. See messgen.h for_each_message().
 */
template<class F>
size_t for_each_message(const std::vector<uint8_t> &payload, F &f) {
    return for_each_message(&payload[0], payload.size(), f);
}

/**
 * @brief Create Dynamic<T> from std::vector<T>.
 */
template<class T>
Dynamic <T> make_dynamic(std::vector<T> &vec) {
    return Dynamic<T>{&vec[0], vec.size()};
}

}
}
