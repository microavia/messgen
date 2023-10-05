#pragma once

#include <messgen/messgen.h>
#include <messgen/test_proto/complex_struct.h>
#include <messgen/test_proto/struct_with_enum.h>
#include <messgen/test_proto/var_size_struct.h>

#include <gtest/gtest.h>

class TestMessgen : public ::testing::Test {
public:
    TestMessgen() {
    }

protected:
    void SetUp() final {
        using namespace messgen::test_proto;
        _buf.clear();
    }

    void TearDown() final {
    }

    std::vector<uint8_t> _buf;

    template<class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        _buf.reserve(sz_check);
        size_t ser_size = msg.serialize(&_buf[0]);
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        size_t deser_size = msg1.deserialize(&_buf[0]);
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_TRUE(msg == msg1);
    }
};

TEST_F(TestMessgen, SimpleStruct) {
    messgen::test_proto::simple_struct msg{};
    msg.f0 = 1;
    msg.f1 = 2;
    msg.f2 = 3;
    msg.f3 = 4;
    msg.f4 = 5;
    msg.f5 = 6;
    msg.f6 = 7;
    msg.f8 = 9;

    test_serialization(msg);
}

TEST_F(TestMessgen, StructWithEnum) {
    messgen::test_proto::struct_with_enum msg{};
    msg.f0 = 1;
    msg.f1 = 2;
    msg.e0 = messgen::test_proto::simple_enum::another_value;

    test_serialization(msg);
}

TEST_F(TestMessgen, VarSizeStruct) {
    messgen::test_proto::var_size_struct msg{};
    msg.f0 = 1;
    msg.f1_vec.resize(2);
    msg.f1_vec[0] = 3;
    msg.f1_vec[1] = 4;

    test_serialization(msg);
}

TEST_F(TestMessgen, ComplexStruct) {
    messgen::test_proto::complex_struct msg{};
    msg.f0 = 255;
    msg.f2_vec.push_back(45.787);
    msg.e_vec.push_back(messgen::test_proto::simple_enum::another_value);
    msg.s_arr[0].f3 = 3;
    msg.s_arr[1].f3 = 5;
    msg.v_vec0.resize(1);
    msg.v_vec0[0].resize(2);
    msg.v_vec0[0][0].f1_vec.resize(3);
    msg.v_vec0[0][0].f1_vec[2] = 3242;
    msg.v_vec2.resize(2);
    msg.v_vec2[1][0].resize(3);
    msg.v_vec2[1][0][2] = 5;
    msg.str = "Hello messgen!";
    msg.str_vec.push_back("spam");
    msg.str_vec.push_back("eggs");
    msg.str_vec.push_back("sticks");
    msg.map_str_by_int[23] = "ping";
    msg.map_str_by_int[777] = "pong";
    msg.map_vec_by_str["cat"].push_back(1);
    msg.map_vec_by_str["cat"].push_back(2);
    msg.map_vec_by_str["cat"].push_back(3);
    msg.map_vec_by_str["dog"].push_back(30);
    msg.map_vec_by_str["dog"].push_back(40);

    test_serialization(msg);
}
