#include <messgen/messgen.h>
#include <messgen/test_proto/complex_struct.h>
#include <messgen/test_proto/struct_with_enum.h>
#include <messgen/test_proto/var_size_struct.h>
#include <messgen/test_proto/flat_struct.h>
#include <messgen/test_proto/complex_struct_with_empty.h>
#include <another_proto.h>

#include <gtest/gtest.h>

class CppTest : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;

    template <class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        _buf.resize(sz_check);
        size_t ser_size = msg.serialize(_buf.data());
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        size_t deser_size = msg1.deserialize(_buf.data());
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }

    template <class T>
    void test_zerocopy(const T &msg) {
        size_t sz_check = msg.serialized_size();

        EXPECT_EQ(T::FLAT_SIZE, sz_check);

        _buf.resize(sz_check);
        size_t ser_size = msg.serialize(_buf.data());
        EXPECT_EQ(ser_size, sz_check);

        EXPECT_EQ(memcmp(&msg, _buf.data(), sz_check), 0);

        T msg1{};
        size_t deser_size = msg1.deserialize(_buf.data());
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }
};

TEST_F(CppTest, SimpleStruct) {
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

TEST_F(CppTest, StructWithEnum) {
    messgen::test_proto::struct_with_enum msg{};
    msg.f0 = 1;
    msg.f1 = 2;
    msg.e0 = messgen::test_proto::simple_enum::another_value;

    test_serialization(msg);
}

TEST_F(CppTest, VarSizeStruct) {
    messgen::test_proto::var_size_struct msg{};
    std::vector<int64_t> v;
    v.resize(2);
    v[0] = 3;
    v[1] = 4;

    msg.f0 = 1;
    msg.f1_vec = v;

    test_serialization(msg);
}

TEST_F(CppTest, ComplexStruct) {
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
    msg.bs.assign({1, 2, 3, 4, 5});
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

TEST_F(CppTest, FlatStruct) {
    messgen::test_proto::flat_struct msg{};

    msg.f0 = 1;
    msg.f1 = 2;
    msg.f2 = 3;
    msg.f3 = 4;
    msg.f4 = 5;
    msg.f5 = 6;
    msg.f6 = 7;
    msg.f7 = 7;
    msg.f8 = 9;

    test_serialization(msg);
}

TEST_F(CppTest, FlatStructZeroCopy) {
    messgen::test_proto::flat_struct msg{};

    msg.f0 = 1;
    msg.f1 = 2;
    msg.f2 = 3;
    msg.f3 = 4;
    msg.f4 = 5;
    msg.f5 = 6;
    msg.f6 = 7;
    msg.f7 = 7;
    msg.f8 = 9;

    test_zerocopy(msg);
}

TEST_F(CppTest, TwoMsg) {
    messgen::test_proto::simple_struct msg1{};
    msg1.f0 = 1;
    msg1.f1 = 2;
    msg1.f2 = 3;
    msg1.f3 = 4;
    msg1.f4 = 5;
    msg1.f5 = 6;
    msg1.f6 = 7;
    msg1.f8 = 9;

    messgen::test_proto::flat_struct msg2{};
    msg2.f0 = 1;
    msg2.f1 = 2;
    msg2.f2 = 3;
    msg2.f3 = 4;
    msg2.f4 = 5;
    msg2.f5 = 6;
    msg2.f6 = 7;
    msg2.f7 = 7;
    msg2.f8 = 9;

    size_t sz_check = msg1.serialized_size() + msg2.serialized_size();

    _buf.resize(sz_check);
    size_t ser_size = msg1.serialize(_buf.data());
    ser_size += msg2.serialize(_buf.data() + ser_size);

    EXPECT_EQ(ser_size, sz_check);

    messgen::test_proto::simple_struct msg1c{};
    messgen::test_proto::flat_struct msg2c{};
    size_t deser_size = msg1c.deserialize(_buf.data());
    deser_size += msg2c.deserialize(_buf.data() + deser_size);
    EXPECT_EQ(deser_size, sz_check);

    EXPECT_EQ(msg1, msg1c);
    EXPECT_EQ(msg2, msg2c);
}

TEST_F(CppTest, ComplexStructWithEmpty) {
    messgen::test_proto::complex_struct_with_empty e{};
    test_serialization(e);
}