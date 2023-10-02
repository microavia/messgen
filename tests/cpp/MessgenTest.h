#pragma once

#include <messgen/test_proto/complex_struct.h>

#include <gtest/gtest.h>

class TestMessgen : public ::testing::Test {
public:
    TestMessgen() {
        _ser_buf.reserve(BUF_SIZE);
    }

protected:
    void SetUp() final {
        using namespace messgen::test_proto;
        _ser_buf.clear();
    }

    void TearDown() final {
    }

protected:
    messgen::test_proto::complex_struct _msg{};

    static constexpr size_t BUF_SIZE = 1024 * 2;
    std::vector<uint8_t> _ser_buf;
};


TEST_F(TestMessgen, PlainMessageTest) {
    _msg.serialize(_buf)
    serialize_and_assert(_simple_msg);
}
