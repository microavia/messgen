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


namespace . {
namespace msgs {
namespace messages {
namespace messgen {
namespace messgen_test {

struct simple_dynamic_message {
    static constexpr uint8_t TYPE = 3;
    static constexpr size_t STATIC_SIZE = 42; /*<! Plain fields size + dynamic fields length */
    static constexpr uint8_t PROTO = PROTO_ID;
    
    int64_t f1;
    double f2;
    int32_t f4;
    float f5;
    uint16_t f6;
    int16_t f7;
    messgen::Dynamic<uint64_t> f0;
    messgen::Dynamic<uint32_t> f3;
    messgen::Dynamic<uint8_t> f8;
    messgen::Dynamic<int8_t> f9;
    std::string_view my_null_string;
    std::string_view non_null_string1;
    std::string_view non_null_string2;
    
    bool operator== (const .::msgs::messages::messgen::messgen_test::simple_dynamic_message& other) const {
        if (!(f1 == other.f1)) {return false;}
        
        if (!(f2 == other.f2)) {return false;}
        
        if (!(f4 == other.f4)) {return false;}
        
        if (!(f5 == other.f5)) {return false;}
        
        if (!(f6 == other.f6)) {return false;}
        
        if (!(f7 == other.f7)) {return false;}
        
        if (f0.size != other.f0.size) {return false;}
        if (memcmp(f0.ptr, other.f0.ptr, 8 * f0.size) != 0) {return false;}
        
        if (f3.size != other.f3.size) {return false;}
        if (memcmp(f3.ptr, other.f3.ptr, 4 * f3.size) != 0) {return false;}
        
        if (f8.size != other.f8.size) {return false;}
        if (memcmp(f8.ptr, other.f8.ptr, 1 * f8.size) != 0) {return false;}
        
        if (f9.size != other.f9.size) {return false;}
        if (memcmp(f9.ptr, other.f9.ptr, 1 * f9.size) != 0) {return false;}
        
        if (!(my_null_string == other.my_null_string)) {return false;}
        
        if (!(non_null_string1 == other.non_null_string1)) {return false;}
        
        if (!(non_null_string2 == other.non_null_string2)) {return false;}
        
        return true;
    }
    
    size_t serialize_msg(uint8_t *buf) const {
        uint8_t * ptr = buf;
        (void)ptr;
        uint32_t dyn_field_len;
        (void)dyn_field_len;
        
        memcpy(ptr, &f1, 28);
        ptr += 28;
        
        
        ptr[0] = ((f0.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f0.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f0.ptr, f0.size*8);
        ptr += f0.size*8;
        
        ptr[0] = ((f3.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f3.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f3.ptr, f3.size*4);
        ptr += f3.size*4;
        
        ptr[0] = ((f8.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f8.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f8.ptr, f8.size*1);
        ptr += f8.size*1;
        
        ptr[0] = ((f9.size >> (0U*8U)) & 0xFFU);
        ptr[1] = ((f9.size >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, f9.ptr, f9.size*1);
        ptr += f9.size*1;
        
        dyn_field_len = my_null_string.length();
        ptr[0] = ((dyn_field_len >> (0U*8U)) & 0xFFU);
        ptr[1] = ((dyn_field_len >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, my_null_string.data(), dyn_field_len);
        ptr += dyn_field_len;
        
        dyn_field_len = non_null_string1.length();
        ptr[0] = ((dyn_field_len >> (0U*8U)) & 0xFFU);
        ptr[1] = ((dyn_field_len >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, non_null_string1.data(), dyn_field_len);
        ptr += dyn_field_len;
        
        dyn_field_len = non_null_string2.length();
        ptr[0] = ((dyn_field_len >> (0U*8U)) & 0xFFU);
        ptr[1] = ((dyn_field_len >> (1U*8U)) & 0xFFU);
        ptr += 2;
        memcpy(ptr, non_null_string2.data(), dyn_field_len);
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
        
        if (len < 28) {return -1;}
        memcpy(&f1, ptr, 28);
        ptr += 28;
        len -= 28;
        
        
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
        f3.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f3.ptr = allocator.alloc<uint32_t>(f3.size);
        if (f3.ptr == nullptr) {return -1;}
        if (len < f3.size * 4) {return -1;}
        memcpy(f3.ptr, ptr, f3.size * 4);
        ptr += f3.size * 4;
        len -= f3.size * 4;
        
        if (len < 2) {return -1;}
        f8.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f8.ptr = allocator.alloc<uint8_t>(f8.size);
        if (f8.ptr == nullptr) {return -1;}
        if (len < f8.size * 1) {return -1;}
        memcpy(f8.ptr, ptr, f8.size * 1);
        ptr += f8.size * 1;
        len -= f8.size * 1;
        
        if (len < 2) {return -1;}
        f9.size =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        f9.ptr = allocator.alloc<int8_t>(f9.size);
        if (f9.ptr == nullptr) {return -1;}
        if (len < f9.size * 1) {return -1;}
        memcpy(f9.ptr, ptr, f9.size * 1);
        ptr += f9.size * 1;
        len -= f9.size * 1;
        
        if (len < 2) {return -1;}
        dyn_parsed_len =  (ptr[0] << (0U*8U)) | (ptr[1] << (1U*8U));
        ptr += 2;
        len -= 2;
        if (dyn_parsed_len > 0) {
            string_tmp_buf = allocator.alloc<char>(dyn_parsed_len);
            if (string_tmp_buf == nullptr) {return -1;}
            if (len < dyn_parsed_len) {return -1;}
            memcpy(string_tmp_buf, ptr, dyn_parsed_len);
            my_null_string = std::string_view{string_tmp_buf, dyn_parsed_len};
            ptr += dyn_parsed_len;
            len -= dyn_parsed_len;
            
        }
        else {
            my_null_string = {};
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
            non_null_string1 = std::string_view{string_tmp_buf, dyn_parsed_len};
            ptr += dyn_parsed_len;
            len -= dyn_parsed_len;
            
        }
        else {
            non_null_string1 = {};
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
            non_null_string2 = std::string_view{string_tmp_buf, dyn_parsed_len};
            ptr += dyn_parsed_len;
            len -= dyn_parsed_len;
            
        }
        else {
            non_null_string2 = {};
        }
        return static_cast<int>(ptr - buf);
    }
    
    size_t get_size() const {
        return STATIC_SIZE + get_dynamic_size();
    }
    
    size_t get_dynamic_size() const {
        size_t size = 0;
        size += f0.size*8;
        size += f3.size*4;
        size += f8.size*1;
        size += f9.size*1;
        size += my_null_string.length();
        size += non_null_string1.length();
        size += non_null_string2.length();
        return size;
    }
    
    static const messgen::Metadata METADATA;
    
};

} // .
} // msgs
} // messages
} // messgen
} // messgen_test

