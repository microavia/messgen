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
#include <./msgs/messages/messgen/messgen_test/embedded_message_d1.h>
#include <./msgs/messages/messgen/messgen_test/simple_message.h>


namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

struct embedded_message_d2 {
    static constexpr uint8_t TYPE = 2;
    static constexpr size_t STATIC_SIZE = 412; /*<! Plain fields size + dynamic fields length */
    static constexpr uint8_t PROTO = PROTO_ID;
    
    double f1[2];
    uint8_t f0;
    uint8_t f4;
    .::msgs::messages::messgen::messgen_test::embedded_message_d1 f2;
    .::msgs::messages::messgen::messgen_test::simple_message f3; // Test comment f3
    .::msgs::messages::messgen::messgen_test::embedded_message_d1 f5;
    
    bool operator== (const .::msgs::messages::messgen::messgen_test::embedded_message_d2& other) const {
        if (memcmp(f1, other.f1, 8 * 2) != 0) {return false;}
        
        if (!(f0 == other.f0)) {return false;}
        
        if (!(f4 == other.f4)) {return false;}
        
        if (!(f2 == other.f2)) {return false;}
        
        if (!(f3 == other.f3)) {return false;}
        
        if (!(f5 == other.f5)) {return false;}
        
        return true;
    }
    
    size_t serialize_msg(uint8_t *buf) const {
        uint8_t * ptr = buf;
        (void)ptr;
        uint32_t dyn_field_len;
        (void)dyn_field_len;
        
        memcpy(ptr, &f1, 18);
        ptr += 18;
        
        ptr += f2.serialize_msg(ptr);
        ptr += f3.serialize_msg(ptr);
        ptr += f5.serialize_msg(ptr);
        
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
        
        if (len < 18) {return -1;}
        memcpy(&f1, ptr, 18);
        ptr += 18;
        len -= 18;
        
        parse_result = f2.parse_msg(ptr, len, allocator);
        if (parse_result < 0) { return -1; }
        ptr += parse_result;
        parse_result = f3.parse_msg(ptr, len, allocator);
        if (parse_result < 0) { return -1; }
        ptr += parse_result;
        parse_result = f5.parse_msg(ptr, len, allocator);
        if (parse_result < 0) { return -1; }
        ptr += parse_result;
        
        return static_cast<int>(ptr - buf);
    }
    
    size_t get_size() const {
        return STATIC_SIZE + get_dynamic_size();
    }
    
    size_t get_dynamic_size() const {
        size_t size = 0;
        size += f2.get_dynamic_size();
        size += f3.get_dynamic_size();
        size += f5.get_dynamic_size();
        return size;
    }
    
    static const messgen::Metadata METADATA;
    
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

