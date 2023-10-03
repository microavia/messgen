#pragma once

#include <messgen/messgen.h>
#include <messgen/test_proto/complex_struct.h>

#include <gtest/gtest.h>

class TestMessgen : public ::testing::Test {
public:
    TestMessgen() {
        _buf.reserve(BUF_SIZE);
    }

protected:
    void SetUp() final {
        using namespace messgen::test_proto;
        _buf.clear();
        _msg.f0 = 35;
        _msg.f2_vec.push_back(45.787);
        _msg.e_vec.push_back(messgen::test_proto::simple_enum::another_value);
        _msg.s_arr[0].f3 = 3;
        _msg.v_vec0.resize(1);
        _msg.v_vec0[0].resize(2);
        _msg.v_vec0[0][0].f1_vec.resize(3);
        _msg.v_vec0[0][0].f1_vec[2] = 3242;
    }

    void TearDown() final {
    }

    messgen::test_proto::complex_struct _msg{};

    static constexpr size_t BUF_SIZE = 1024 * 2;
    std::vector<uint8_t> _buf;

    template<class T>
    void serialize_msg(const T &msg) {
        size_t sz_check = messgen::serialized_size(msg);
        _buf.reserve(sz_check);
        size_t sz = messgen::serialize(msg, &_buf[0]);
        EXPECT_EQ(sz, sz_check);
        T msg1{};
        EXPECT_EQ(memcmp(reinterpret_cast<const uint8_t *>(&msg), reinterpret_cast<uint8_t *>(&msg1), sz), 0);
    }
};


TEST_F(TestMessgen, PlainMessageTest) {
    serialize_msg(_msg);
}
