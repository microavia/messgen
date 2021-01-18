#pragma once

#include <cstdint>
#include <cstring>
#if (__cplusplus >= 201703L)
#    include <string_view>
#endif
#include <messgen/Metadata.h>
#include <messgen/Dynamic.h>
#include <messgen/MemoryAllocator.h>
#include "proto.h"
#include "constants.h"


namespace messgen {
namespace msgs {
namespace messgen_test {

struct simple_message {
    static constexpr uint8_t TYPE = 0;
    static constexpr size_t STATIC_SIZE = 42; /*<! Plain fields size + dynamic fields length */
    static constexpr uint8_t PROTO = PROTO_ID;
    
    uint64_t f0;
    int64_t f1;
    double f2;
    uint32_t f3;
    int32_t f4;
    float f5;
    uint16_t f6;
    int16_t f7;
    uint8_t f8;
    int8_t f9;
    
    bool operator== (const messgen::msgs::messgen_test::simple_message& other) const {
        if (!(f0 == other.f0)) {return false;}
        
        if (!(f1 == other.f1)) {return false;}
        
        if (!(f2 == other.f2)) {return false;}
        
        if (!(f3 == other.f3)) {return false;}
        
        if (!(f4 == other.f4)) {return false;}
        
        if (!(f5 == other.f5)) {return false;}
        
        if (!(f6 == other.f6)) {return false;}
        
        if (!(f7 == other.f7)) {return false;}
        
        if (!(f8 == other.f8)) {return false;}
        
        if (!(f9 == other.f9)) {return false;}
        
        return true;
    }
    
    size_t serialize_msg(uint8_t *buf) const {
        uint8_t * ptr = buf;
        (void)ptr;
        uint32_t dyn_field_len;
        (void)dyn_field_len;
        
        memcpy(ptr, &f0, 42);
        ptr += 42;
        
        
        return ptr - buf;
    }
    
    int parse_msg(const uint8_t *buf, uint16_t len, messgen::MemoryAllocator & allocator) {
        (void)allocator;
        const uint8_t * ptr = buf;
        (void)ptr;
        char * string_tmp_buf;
        (void) string_tmp_buf;
        size_t dyn_parsed_len;
        (void)dyn_parsed_len;
        int parse_result;
        (void)parse_result;
        
        if (len < 42) {return -1;}
        memcpy(&f0, ptr, 42);
        ptr += 42;
        len -= 42;
        
        
        return static_cast<int>(ptr - buf);
    }
    
    size_t get_size() const {
        return STATIC_SIZE + get_dynamic_size();
    }
    
    size_t get_dynamic_size() const {
        size_t size = 0;
        return size;
    }
    
    static const messgen::Metadata METADATA;
    
};

} // messgen
} // msgs
} // messgen_test

