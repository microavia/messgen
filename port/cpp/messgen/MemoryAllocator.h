#pragma once

#include <cstdint>


namespace messgen {

class MemoryAllocator {
public:
    MemoryAllocator(uint8_t *mem, size_t memory_size) :
            _mem_start(mem), _size(memory_size) {}

    template<class T>
    T * alloc(size_t num) {
        const size_t alloc_size = sizeof(T) * num;
        if (align(alignof(T), alloc_size, _mem_start, _size)) {
            T *ptr = reinterpret_cast<T *>(_mem_start);
            _mem_start = (uint8_t *) _mem_start + alloc_size;
            _size -= alloc_size;

            return ptr;
        }

        return nullptr;
    }

private:
    static inline void*
    align(size_t __align, size_t __size, void*& __ptr, size_t& __space) noexcept
    {
        const auto __intptr = reinterpret_cast<uintptr_t>(__ptr);
        const auto __aligned = (__intptr - 1u + __align) & -__align;
        const auto __diff = __aligned - __intptr;
        if ((__size + __diff) > __space)
            return nullptr;
        else
        {
            __space -= __diff;
            return __ptr = reinterpret_cast<void*>(__aligned);
        }
    }


    void *_mem_start;
    size_t _size;
};

}
