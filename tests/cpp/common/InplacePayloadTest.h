#pragma once

#include "messgen/inplace_payload.h"
#include "messgen/messgen_def.h"

#include <cstdint>
#include <gtest/gtest.h>

#define SOME_TEXT "some_text"
#define OTHER_TEXT "other_text"

template <auto size>
struct contents {
    messgen::size_type _size;
    uint8_t _data[size];
};

class InplacePayloadTest : public ::testing::Test {};

TEST_F(InplacePayloadTest, DefaultConstructPayload) {
    auto mem = contents<0>{};
    auto &actual = *(new (&mem) messgen::inplace_payload{});
    EXPECT_EQ(0, actual.size());
}

TEST_F(InplacePayloadTest, AssignPayload) {
    auto mem = contents<sizeof(SOME_TEXT)>{};
    auto expected = std::string{SOME_TEXT};

    auto &actual = *(new ((void *)&mem) messgen::inplace_payload{});
    actual.assign((uint8_t *)expected.data(), (uint8_t *)expected.data() + expected.size());

    EXPECT_EQ(expected.size(), actual.size());
    EXPECT_EQ(expected, (const char *)actual.data());
}

TEST_F(InplacePayloadTest, CopyAssignPayload) {

    auto expected = std::string{OTHER_TEXT};

    auto mem_other = contents<sizeof(OTHER_TEXT)>{};
    auto &other = *(new (&mem_other) messgen::inplace_payload{});
    other.assign((uint8_t *)expected.data(), (uint8_t *)expected.data() + expected.size());

    auto mem_actual = contents<sizeof(OTHER_TEXT)>{};
    auto &actual = *(new (&mem_actual) messgen::inplace_payload{});
    actual = other;

    EXPECT_EQ(expected.size(), actual.size());
    EXPECT_EQ(expected, (const char *)actual.data());
}

TEST_F(InplacePayloadTest, ComparePayloadEqual) {

    auto text = std::string{OTHER_TEXT};

    auto mem_1 = contents<sizeof(OTHER_TEXT)>{};
    auto &payload_1 = *(new (&mem_1) messgen::inplace_payload{});
    payload_1.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size());

    auto mem_2 = contents<sizeof(OTHER_TEXT)>{};
    auto &payload_2 = *(new (&mem_2) messgen::inplace_payload{});
    payload_2.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size());

    EXPECT_EQ(payload_1, payload_2);
    EXPECT_EQ(payload_2, payload_1);
}

TEST_F(InplacePayloadTest, ComparePayloadSizeNotEqual) {

    auto text = std::string{OTHER_TEXT};

    auto mem_1 = contents<sizeof(OTHER_TEXT)>{};
    auto &payload_1 = *(new (&mem_1) messgen::inplace_payload{});
    payload_1.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size());

    auto mem_2 = contents<sizeof(OTHER_TEXT)>{};
    auto &payload_2 = *(new (&mem_2) messgen::inplace_payload{});
    payload_2.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size() - 1);

    EXPECT_NE(payload_1, payload_2);
    EXPECT_NE(payload_2, payload_1);
}

TEST_F(InplacePayloadTest, ComparePayloadDataNotEqual) {
    auto text = std::string{SOME_TEXT};

    auto mem_1 = contents<sizeof(SOME_TEXT)>{};
    auto &payload_1 = *(new (&mem_1) messgen::inplace_payload{});
    payload_1.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size());

    auto mem_2 = contents<sizeof(SOME_TEXT)>{};
    auto &payload_2 = *(new (&mem_2) messgen::inplace_payload{});
    payload_2.assign((uint8_t *)text.data(), (uint8_t *)text.data() + text.size());
    payload_2.data()[1] = 'w';

    EXPECT_NE(payload_1, payload_2);
    EXPECT_NE(payload_2, payload_1);
}
