#pragma once

#include <microavia/net_device/Frame.h>

#include <gtest/gtest.h>
#include <cstdint>
#include <cstring>
#include <vector>


microavia::net_device::Frame generate_random_message(uint8_t MAX_PROTO_TYPE=255,
        uint8_t MAX_SRC_ADDRESS=255, uint8_t MAX_DST_ADDRESS=255, uint16_t MIN_LEN=0, uint16_t MAX_LEN=65535) {
    microavia::net_device::Frame msg;
    msg.proto_id = std::rand() % MAX_PROTO_TYPE;
    msg.dst_addr = (std::rand() % MAX_DST_ADDRESS);
    msg.src_addr = std::rand() % MAX_SRC_ADDRESS;

    size_t payload_size = MIN_LEN + (std::rand() % (MAX_LEN-MIN_LEN));

    uint8_t *buf = nullptr;
    if (payload_size != 0) {
        buf = new uint8_t[payload_size];

        for (int i = 0; i < payload_size; i++) {
            buf[i] = std::rand() % 256;
        }
    }

    msg.payload = microavia::ConstSlice<uint8_t>(buf, payload_size);
    return msg;
}


void test_equal(const microavia::net_device::Frame &frame1, const microavia::net_device::Frame &frame2) {
    ASSERT_EQ(frame1.src_addr, frame2.src_addr);
    ASSERT_EQ(frame1.dst_addr, frame2.dst_addr);
    ASSERT_EQ(frame1.proto_id, frame2.proto_id);
    ASSERT_EQ(frame1.payload.size(), frame2.payload.size());
    ASSERT_EQ(memcmp(frame1.payload.begin(), frame2.payload.begin(), frame2.payload.size()), 0);

}