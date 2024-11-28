#include <messgen/messgen.h>
#include <messgen/test_proto/complex_struct_nostl.h>
#include <messgen/test_proto/struct_with_enum.h>
#include <messgen/test_proto/var_size_struct.h>
#include <messgen/test_proto/empty_struct.h>
#include <messgen/test_proto/flat_struct.h>

#include <gtest/gtest.h>

class CppNostlTest : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;
    messgen::StaticAllocator<1024 * 1024> _alloc;

    template <class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        _buf.reserve(sz_check);
        size_t ser_size = msg.serialize(&_buf[0]);
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        size_t deser_size = msg1.deserialize(&_buf[0], _alloc);
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_TRUE(msg == msg1);
    }
};

TEST_F(CppNostlTest, SimpleStruct) {
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

TEST_F(CppNostlTest, StructWithEnum) {
    messgen::test_proto::struct_with_enum msg{};
    msg.f0 = 1;
    msg.f1 = 2;
    msg.e0 = messgen::test_proto::simple_enum::another_value;

    test_serialization(msg);
}

TEST_F(CppNostlTest, VarSizeStruct) {
    messgen::test_proto::var_size_struct msg{};
    std::vector<int64_t> v;
    v.resize(2);
    v[0] = 3;
    v[1] = 4;

    msg.f0 = 1;
    msg.f1_vec = v;

    test_serialization(msg);
}

TEST_F(CppNostlTest, ComplexStructNpstl) {
    messgen::test_proto::complex_struct_nostl msg{};
    msg.f0 = 255;
    std::vector<double> f2_vec;
    f2_vec.push_back(45.787);
    msg.f2_vec = f2_vec;

    msg.s_arr[0].f3 = 3;
    msg.s_arr[1].f3 = 5;

    std::vector<int64_t> v_vec0_0_0;
    v_vec0_0_0.emplace_back(777);
    std::vector<messgen::test_proto::var_size_struct> v_vec0_0;
    v_vec0_0.emplace_back(234, v_vec0_0_0);
    std::vector<messgen::vector<messgen::test_proto::var_size_struct>> v_vec0;
    v_vec0.emplace_back(v_vec0_0);
    msg.v_vec0 = v_vec0;

    test_serialization(msg);
}

TEST_F(CppNostlTest, EmptyStruct) {
    messgen::test_proto::empty_struct e{};
    ASSERT_TRUE(e.IS_FLAT);
    ASSERT_EQ(e.FLAT_SIZE, 0);
    ASSERT_EQ(e.serialized_size(), 0);
    test_serialization(e);
}

TEST_F(CppNostlTest, MessageConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(message<test_proto::simple_struct>);
    EXPECT_FALSE(message<not_a_message>);
    EXPECT_FALSE(message<int>);
}

TEST_F(CppNostlTest, FlatMessageConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_message<test_proto::flat_struct>);
    EXPECT_FALSE(flat_message<test_proto::var_size_struct>);
    EXPECT_FALSE(flat_message<int>);
}