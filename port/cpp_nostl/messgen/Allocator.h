#pragma once

#include <cstddef>
#include <cstdint>

namespace messgen {

/**
 * @brief Class for holding dynamic fields while parsing
 * @note  Class is supposed to be re-created after each parse call
 */
class Allocator {
public:
    Allocator() noexcept: _ptr(nullptr), _size(0) {}

    Allocator(uint8_t *ptr, size_t size) noexcept: _ptr(ptr), _size(size) {}

    /**
     * @brief Allocates memory for num objects of type T
     * @tparam T    -   type of object
     * @param num   -   number of objects
     * @return pointer to allocated memory or nullptr if not enough memory
     */
    template<class T>
    T *alloc(size_t n) noexcept {
        if (n == 0) {
            return reinterpret_cast<T *>(_ptr);
        }

        const size_t alloc_size = sizeof(T) * n;
        if (align(alignof(T), alloc_size, _ptr, _size)) {
            T *ptr = reinterpret_cast<T *>(_ptr);
            _ptr = (uint8_t *) _ptr + alloc_size;
            _size -= alloc_size;

            return ptr;
        }

        return nullptr;
    }

private:
    /**
     * @brief Aligns pointer to align bytes
     * @param align   -   alignment
     * @param size    -   size of object
     * @param ptr     -   pointer to align
     * @param space   -   space left
     * @return aligned pointer
     */
    static inline void *align(size_t align, size_t size, void *&ptr, size_t &space) noexcept {
        const auto intptr = reinterpret_cast<uintptr_t>(ptr);
        const auto aligned = (intptr - 1u + align) & -align;
        const auto diff = aligned - intptr;
        if ((size + diff) > space)
            return nullptr;
        else {
            space -= diff;
            return ptr = reinterpret_cast<void *>(aligned);
        }
    }

    void *_ptr;
    size_t _size;
};

/**
 * @brief Class which allows to statically allocate memory for messgen parsing
 * @tparam MEM_SIZE     -   memory size
 * @warning Each parse call on this class will clear memory, so if you want to do multiple parse calls
 *          store it into temporary MemoryAllocator& variable.
 */
template<size_t MEM_SIZE>
class StaticAllocator {
public:
    explicit StaticAllocator() noexcept:
            _alloc(_memory, MEM_SIZE) {}

    operator Allocator &() noexcept {
        return get();
    }

    Allocator &get() noexcept {
        _alloc = Allocator(_memory, MEM_SIZE);
        return _alloc;
    }

private:
    uint8_t _memory[MEM_SIZE]{};
    Allocator _alloc;
};

}
