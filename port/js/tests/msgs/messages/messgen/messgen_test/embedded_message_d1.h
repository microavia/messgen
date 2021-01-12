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
#include <./msgs/messages/messgen/messgen_test/simple_message.h>


namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

struct embedded_message_d1 {
    static constexpr uint8_t TYPE = 1;
    static constexpr size_t STATIC_SIZE = 176; /*<! Plain fields size + dynamic fields length */
    static constexpr uint8_t PROTO = PROTO_ID;
    
    uint64_t f2[5];
    uint8_t f0[10];
    .::msgs::messages::messgen::messgen_test::simple_message f1[2];
    .::msgs::messages::messgen::messgen_test::simple_message f3;
    
    bool operator== (const .::msgs::messages::messgen::messgen_test::embedded_message_d1& other) const {
        if (memcmp(f2, other.f2, 8 * 5) != 0) {return false;}
        
        if (memcmp(f0, other.f0, 1 * 10) != 0) {return false;}
        
        for (size_t i = 0; i < 2; ++i) {
            if (!(f1[i] == other.f1[i])) {return false;}
        }
        
        if (!(f3 == other.f3)) {return false;}
        
        return true;
    }
    
    size_t serialize_msg(uint8_t *buf) const {
        uint8_t * ptr = buf;
        (void)ptr;
        uint32_t dyn_field_len;
        (void)dyn_field_len;
        
        memcpy(ptr, &f2, 50);
        ptr += 50;
        
        for (size_t i = 0; i < 2; ++i) {
            ptr += f1[i].serialize_msg(ptr);
        }
        
        ptr += f3.serialize_msg(ptr);
        
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
        
        if (len < 50) {return -1;}
        memcpy(&f2, ptr, 50);
        ptr += 50;
        len -= 50;
        
        for (size_t i = 0; i < 2; ++i) {
            parse_result = f1[i].parse_msg(ptr, len, allocator);
            if (parse_result < 0) {return -1;}
            ptr += parse_result;
            len -= parse_result;
        }
        
        parse_result = f3.parse_msg(ptr, len, allocator);
        if (parse_result < 0) { return -1; }
        ptr += parse_result;
        
        return static_cast<int>(ptr - buf);
    }
    
    size_t get_size() const {
        return STATIC_SIZE + get_dynamic_size();
    }
    
    size_t get_dynamic_size() const {
        size_t size = 0;
        for (size_t i = 0; i < 2; ++i) {
            size += f1[i].get_dynamic_size();
        }
        size += f3.get_dynamic_size();
        return size;
    }
    
    static const messgen::Metadata METADATA;
    
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

