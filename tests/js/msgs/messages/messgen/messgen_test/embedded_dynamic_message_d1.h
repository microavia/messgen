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
#include <./msgs/messages/messgen/messgen_test/simple_dynamic_message.h>
#include <./msgs/messages/messgen/messgen_test/simple_message.h>


namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

struct embedded_dynamic_message_d1 {
    static constexpr uint8_t TYPE = 4;
    static constexpr size_t STATIC_SIZE = 139; /*<! Plain fields size + dynamic fields length */
    static constexpr uint8_t PROTO = PROTO_ID;
    
    uint8_t f3;
    .::msgs::messages::messgen::messgen_test::simple_dynamic_message f5[2];
    .::msgs::messages::messgen::messgen_test::simple_dynamic_message f6;
    messgen::Dynamic<uint64_t> f0; // Test comment f0
    messgen::Dynamic<.::msgs::messages::messgen::messgen_test::simple_dynamic_message> f1; // Test comment f1
    messgen::Dynamic<.::msgs::messages::messgen::messgen_test::simple_message> f2;
    messgen::Dynamic<int8_t> f4;
    std::string_view f7; // Test comment f7
    std::string_view f8;
    
    bool operator== (const .::msgs::messages::messgen::messgen_test::embedded_dynamic_message_d1& other) const {
        if (!(f3 == other.f3)) {return false;}
        
        for (size_t i = 0; i < 2; ++i) {
            if (!(f5[i] == other.f5[i])) {return false;}
        }
        
        if (!(f6 == other.f6)) {return false;}
        
        if (f0.size != other.f0.size) {return false;}
        if (memcmp(f0.ptr, other.f0.ptr, 8 * f0.size) != 0) {return false;}
        
        if (f1.size != other.f1.size) {return false;}
        for (size_t i = 0; i < f1.size; ++i) {
            if (!(f1.ptr[i] == other.f1.ptr[i])) {return false;}
        }
        
        if (f2.size != other.f2.size) {return false;}
        for (size_t i = 0; i < f2.size; ++i) {
            if (!(f2.ptr[i] == other.f2.ptr[i])) {return false;}
        }
        
        if (f4.size != other.f4.size) {return false;}
        if (memcmp(f4.ptr, other.f4.ptr, 1 * f4.size) != 0) {return false;}
        
        if (!(f7 == other.f7)) {return false;}
        
        if (!(f8 == other.f8)) {return false;}
        
        return true;
    }
    
    size_t serialize_msg(uint8_t *buf) const {
        uint8_t * ptr = buf;
        (void)ptr;
        uint32_t dyn_field_len;
        (void)dyn_field_len;
        
        memcpy(ptr, &f3, 1);
        ptr += 1;
        
        for (size_t i = 0; i < 2; ++i) {
            ptr += f5[i].serialize_msg(ptr);
        }
        
        ptr += f6.serialize_msg(ptr);
        
        ptr[0] = ((f0.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f0.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f0.ptr, f0.size*8);
        ptr += f0.size*8;
        
        ptr[0] = ((f1.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f1.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        for (size_t i = 0; i < f1.size; ++i) {
            ptr += f1.ptr[i].serialize_msg(ptr);
        }
        
        ptr[0] = ((f2.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f2.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        for (size_t i = 0; i < f2.size; ++i) {
            ptr += f2.ptr[i].serialize_msg(ptr);
        }
        
        ptr[0] = ((f4.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f4.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f4.ptr, f4.size*1);
        ptr += f4.size*1;
        
        dyn_field_len = f7.length();
        ptr[0] = ((dyn_field_len >> (0U*8U)) & 0xFFU);
        ptr[1] = ((dyn_field_len >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f7.data(), dyn_field_len);
        ptr += dyn_field_len;
        
        dyn_field_len = f8.length();
        ptr[0] = ((dyn_field_len >> (0U*8U)) & 0xFFU);
        ptr[1] = ((dyn_field_len >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f8.data(), dyn_field_len);
        ptr += dyn_field_len;
        
        return ptr - buf;
    }
    
    int parse_msg(const uint8_t *buf, uint16_t len, messgen::MemoryAllocator & allocator) {
        const uint8_t * ptr = buf;
        (void)ptr;
        char * string_tmp_buf;
        (void) string_tmp_buf;
        size_t dyn_parsed_len;
        (void)dyn_parsed_len;
        int parse_result;
        (void)parse_result;
        
        if (len < 1) {return -1;}
        memcpy(&f3, ptr, 1);
        ptr += 1;
        len -= 1;
        
        for (size_t i = 0; i < 2; ++i) {
            parse_result = f5[i].parse_msg(ptr, len, allocator);
            if (parse_result < 0) {return -1;}
            ptr += parse_result;
            len -= parse_result;
        }
        
        parse_result = f6.parse_msg(ptr, len, allocator);
        if (parse_result < 0) { return -1; }
        ptr += parse_result;
        
        if (len < 2) {return -1;}
        f0.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f0.ptr = allocator.alloc<uint64_t>(f0.size);
        if (f0.ptr == nullptr) {return -1;}
        if (len < f0.size * 8) {return -1;}
        memcpy(f0.ptr, ptr, f0.size * 8);
        ptr += f0.size * 8;
        len -= f0.size * 8;
        
        if (len < 2) {return -1;}
        f1.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f1.ptr = allocator.alloc<.::msgs::messages::messgen::messgen_test::simple_dynamic_message>(f1.size);
        if (f1.ptr == nullptr) {return -1;}
        for (size_t i = 0; i < f1.size; ++i) {
            parse_result = f1.ptr[i].parse_msg(ptr, len, allocator);
            if (parse_result < 0) {return -1;}
            ptr += parse_result;
            len -= parse_result;
        }
        
        if (len < 2) {return -1;}
        f2.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f2.ptr = allocator.alloc<.::msgs::messages::messgen::messgen_test::simple_message>(f2.size);
        if (f2.ptr == nullptr) {return -1;}
        for (size_t i = 0; i < f2.size; ++i) {
            parse_result = f2.ptr[i].parse_msg(ptr, len, allocator);
            if (parse_result < 0) {return -1;}
            ptr += parse_result;
            len -= parse_result;
        }
        
        if (len < 2) {return -1;}
        f4.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f4.ptr = allocator.alloc<int8_t>(f4.size);
        if (f4.ptr == nullptr) {return -1;}
        if (len < f4.size * 1) {return -1;}
        memcpy(f4.ptr, ptr, f4.size * 1);
        ptr += f4.size * 1;
        len -= f4.size * 1;
        
        if (len < 2) {return -1;}
        dyn_parsed_len =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        if (dyn_parsed_len > 0) {
            string_tmp_buf = allocator.alloc<char>(dyn_parsed_len);
            if (string_tmp_buf == nullptr) {return -1;}
            if (len < dyn_parsed_len) {return -1;}
            memcpy(string_tmp_buf, ptr, dyn_parsed_len);
            f7 = std::string_view{string_tmp_buf, dyn_parsed_len};
            ptr += dyn_parsed_len;
            len -= dyn_parsed_len;
            
        }
        else {
            f7 = {};
        }
        if (len < 2) {return -1;}
        dyn_parsed_len =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        if (dyn_parsed_len > 0) {
            string_tmp_buf = allocator.alloc<char>(dyn_parsed_len);
            if (string_tmp_buf == nullptr) {return -1;}
            if (len < dyn_parsed_len) {return -1;}
            memcpy(string_tmp_buf, ptr, dyn_parsed_len);
            f8 = std::string_view{string_tmp_buf, dyn_parsed_len};
            ptr += dyn_parsed_len;
            len -= dyn_parsed_len;
            
        }
        else {
            f8 = {};
        }
        return static_cast<int>(ptr - buf);
    }
    
    size_t get_size() const {
        return STATIC_SIZE + get_dynamic_size();
    }
    
    size_t get_dynamic_size() const {
        size_t size = 0;
        for (size_t i = 0; i < 2; ++i) {
            size += f5[i].get_dynamic_size();
        }
        size += f6.get_dynamic_size();
        size += f0.size*8;
        for (size_t i = 0; i < f1.size; ++i) {
            size += f1.ptr[i].get_size();
        }
        for (size_t i = 0; i < f2.size; ++i) {
            size += f2.ptr[i].get_size();
        }
        size += f4.size*1;
        size += f7.length();
        size += f8.length();
        return size;
    }
    
    static const messgen::Metadata METADATA;
    
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

