#pragma once

#include <messgen/msgs/messgen_test/messages.h>
#include <messgen/messgen.h>
#include <messgen/stl.h>
#include <messgen/Storage.h>
#include <random>
#include <vector>

#include <gtest/gtest.h>

static constexpr int OK = 0;


template <class T>
inline void compact(std::vector<T> & vec, size_t N) {
    size_t to_cpy = vec.size() - N;
    memmove(&vec[0], &vec[N], to_cpy);
    vec.resize(to_cpy);
}


class TestMessgen : public ::testing::Test {
public:
    TestMessgen() :
            gen(SEED) {
        _ser_buf.reserve(SERIALIZE_BUF_SIZE);
    }

protected:
    void SetUp() final {
        using namespace messgen::msgs::messgen_test;
        _ser_buf.clear();

        _simple_msg = gen_random_simple_msg();

        for (size_t i = 0; i < sizeof(_embedded_d1_msg.f0) / sizeof(_embedded_d1_msg.f0[0]); i++) {
            _embedded_d1_msg.f0[i] = i;
        }

        _embedded_d1_msg.f1[0] = _simple_msg;
        _embedded_d1_msg.f1[1] = _simple_msg;

        for (size_t i = 0; i < sizeof(_embedded_d1_msg.f2) / sizeof(_embedded_d1_msg.f2[0]); i++) {
            _embedded_d1_msg.f2[i] = i + 20;
        }

        _embedded_d1_msg.f3 = _simple_msg;

        _embedded_d2_msg.f0 = 255;
        _embedded_d2_msg.f1[0] = 10;
        _embedded_d2_msg.f1[1] = 20;
        _embedded_d2_msg.f2 = _embedded_d1_msg;
        _embedded_d2_msg.f3 = _simple_msg;
        _embedded_d2_msg.f3.f3 = 4000;
        _embedded_d2_msg.f4 = 2;
        _embedded_d2_msg.f5 = _embedded_d1_msg;
        _embedded_d2_msg.f5.f2[0] = -100;

        _simple_dynamic_msg = gen_random_simple_dynamic_msg();

        _embedded_dyn_d1_msg.f0 = messgen::Dynamic<uint64_t>{nullptr, 0};
        _embedded_dyn_d1_msg.f1 = make_dynamic<simple_dynamic_message>(5);
        for (size_t i = 0; i < 5; ++i) {
            _embedded_dyn_d1_msg.f1[i] = gen_random_simple_dynamic_msg();
        }

        _embedded_dyn_d1_msg.f2 = make_dynamic<simple_message>(5);
        for (size_t i = 0; i < 5; ++i) {
            _embedded_dyn_d1_msg.f2[i] = gen_random_simple_msg();
        }
        _embedded_dyn_d1_msg.f3 = 15;
        _embedded_dyn_d1_msg.f4 = gen_random_plain_dynamic_field<int8_t>();
        _embedded_dyn_d1_msg.f5[0] = gen_random_simple_dynamic_msg();
        _embedded_dyn_d1_msg.f5[1] = gen_random_simple_dynamic_msg();
        _embedded_dyn_d1_msg.f6 = gen_random_simple_dynamic_msg();
        _embedded_dyn_d1_msg.f7 = "";
        _embedded_dyn_d1_msg.f8 = "Embedded string";

        _use_one_existing.one = {42};

        memset(&_ser_buf[0], 0, SERIALIZE_BUF_SIZE);
    }


    void TearDown() final {
        delete[] _simple_dynamic_msg.f0.ptr;
        delete[] _simple_dynamic_msg.f3.ptr;
        delete[] _simple_dynamic_msg.f8.ptr;
        delete[] _simple_dynamic_msg.f9.ptr;
    }

protected:
    messgen::msgs::messgen_test::simple_message _simple_msg{};
    messgen::msgs::messgen_test::embedded_message_d1 _embedded_d1_msg{};
    messgen::msgs::messgen_test::embedded_message_d2 _embedded_d2_msg{};
    messgen::msgs::messgen_test::simple_dynamic_message _simple_dynamic_msg{};
    messgen::msgs::messgen_test::embedded_dynamic_message_d1 _embedded_dyn_d1_msg{};
    messgen::msgs::messgen_test::empty _empty_msg{};
    messgen::msgs::messgen_test::use_one_existing _use_one_existing{};

    static constexpr size_t MEMORY_POOL_SIZE = 1024*10;
    static constexpr size_t SERIALIZE_BUF_SIZE = 1024*2;
    static constexpr size_t SEED = 14;

    std::vector<uint8_t> _ser_buf;
    messgen::StaticMemoryAllocator<1024*10> _messgen_alloc;
    std::default_random_engine gen;

    template <class T>
    static void serialize_and_assert_to_vec(const T & msg, std::vector<uint8_t> &vec) {
        size_t init_buf_size = vec.size();
        int res = messgen::stl::serialize(msg, vec);

        ASSERT_EQ(res, messgen::get_serialized_size(msg));
        ASSERT_EQ(vec.size(), init_buf_size + messgen::get_serialized_size(msg));
    }

    template <class T>
    void serialize_and_assert(const T & msg) {
        serialize_and_assert_to_vec(msg, _ser_buf);
    }

    messgen::msgs::messgen_test::simple_dynamic_message gen_random_simple_dynamic_msg() {
        messgen::msgs::messgen_test::simple_dynamic_message msg{};
        msg.f0 = gen_random_plain_dynamic_field<uint64_t>();
        msg.f1 = random < int64_t > ();
        msg.f2 = random < double > ();
        msg.f3 = gen_random_plain_dynamic_field<uint32_t>();
        msg.f4 = random < int32_t > ();
        msg.f5 = random < float > ();
        msg.f6 = random < uint16_t > ();
        msg.f7 = random < int16_t > ();
        msg.f8 = gen_random_plain_dynamic_field<uint8_t>();
        msg.f9 = gen_random_plain_dynamic_field<int8_t>();
        msg.non_null_string1 = "string1";
        msg.non_null_string2 = "string2";

        return msg;
    }

    messgen::msgs::messgen_test::simple_message gen_random_simple_msg() {
        messgen::msgs::messgen_test::simple_message msg{};
        msg.f0 = random < uint64_t > ();
        msg.f1 = random < int64_t > ();
        msg.f2 = random < double > ();
        msg.f3 = random < uint32_t > ();
        msg.f4 = random < int32_t > ();
        msg.f5 = random < float > ();
        msg.f6 = random < uint16_t > ();
        msg.f7 = random < int16_t > ();
        msg.f8 = random < uint8_t > ();
        msg.f9 = random < int8_t > ();

        return msg;
    }

    template<class T>
    messgen::Dynamic<T> gen_random_plain_dynamic_field() {
        auto rand_len = random < uint16_t > (0, 10);
        auto field = make_dynamic<T>(rand_len);

        for (uint16_t i = 0; i < rand_len; ++i) {
            field[i] = random < T > ();
        }

        return field;
    }

    template<class T>
    messgen::Dynamic<T> make_dynamic(uint16_t size) {
        return messgen::Dynamic<T>{new T[size], size};
    }

    template<class T,
            typename = std::enable_if_t<std::is_integral<T>::value>>
    T random(T MIN_LEN = std::numeric_limits<T>::min(),
             T MAX_LEN = std::numeric_limits<T>::max(),
             int hack = 0) {
        std::uniform_int_distribution<T> dist(0, MAX_LEN);
        return dist(gen);
    }

    template<class T,
            typename = std::enable_if_t<std::is_floating_point<T>::value>>
    T random(T MIN_LEN = std::numeric_limits<T>::min(),
             T MAX_LEN = std::numeric_limits<T>::max(),
             double hack = 0) {
        std::uniform_real_distribution<T> dist(0, MAX_LEN);
        return dist(gen);
    }
};


TEST_F(TestMessgen, PlainMessageTest) {
    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_simple_msg);

    messgen::MessageInfo msg_info{};
    messgen::msgs::messgen_test::simple_message parsed_msg{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, _simple_msg.TYPE);
    ASSERT_EQ(messgen::parse(msg_info, parsed_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_simple_msg, parsed_msg);
}

TEST_F(TestMessgen, EmptyMessgenTest) {
    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_empty_msg);

    messgen::MessageInfo msg_info{};
    messgen::msgs::messgen_test::empty parsed_msg{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, _empty_msg.TYPE);
    ASSERT_EQ(messgen::parse(msg_info, parsed_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_empty_msg, parsed_msg);
}

TEST_F(TestMessgen, NestedMessagesTest) {
    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_embedded_d2_msg);

    messgen::MessageInfo msg_info{};
    embedded_message_d2 parsed_msg{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_message_d2::TYPE);
    ASSERT_EQ(messgen::parse(msg_info, parsed_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_embedded_d2_msg, parsed_msg);
}


TEST_F(TestMessgen, OverflowTest) {
    using namespace messgen::msgs::messgen_test;

    std::vector<uint8_t> small_vec;
    small_vec.reserve(12);
    ASSERT_EQ(messgen::stl::serialize(_simple_msg, small_vec), -1);
    ASSERT_EQ(small_vec.size(), 0);
}


TEST_F(TestMessgen, MultipleMessagesSerializeParse) {
    using namespace messgen::msgs::messgen_test;

    messgen::MessageInfo msg_info{};

    embedded_message_d1 d1_parsed{};
    embedded_message_d2 d2_parsed{};
    simple_message simple_parsed{};

    serialize_and_assert(_embedded_d1_msg);
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_message_d1::TYPE);

    serialize_and_assert(_embedded_d2_msg);
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_message_d1::TYPE);

    ASSERT_EQ(messgen::parse(msg_info, d1_parsed, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_embedded_d1_msg, d1_parsed);
    compact(_ser_buf, msg_info.get_total_size());

    // Check that the first message is d2.
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_message_d2::TYPE);

    // Serialize new message
    serialize_and_assert(_simple_msg);
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_message_d2::TYPE);

    // Parse d2
    ASSERT_EQ(messgen::parse(msg_info, d2_parsed, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_embedded_d2_msg, d2_parsed);
    compact(_ser_buf, msg_info.get_total_size());

    // Check that the first message is d1.
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, simple_message::TYPE);

    ASSERT_EQ(messgen::parse(msg_info, simple_parsed, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_simple_msg, simple_parsed);

    // All message parser -> slice must be empty.
    compact(_ser_buf, msg_info.get_total_size());
    ASSERT_EQ(_ser_buf.size(), 0);
}


TEST_F(TestMessgen, TestSimpleDynamicMessage) {
    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_simple_dynamic_msg);

    messgen::MessageInfo msg_info{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, simple_dynamic_message::TYPE);

    messgen::msgs::messgen_test::simple_dynamic_message parsed_simple_dyn_msg{};
    ASSERT_EQ(messgen::parse(msg_info, parsed_simple_dyn_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_simple_dynamic_msg, parsed_simple_dyn_msg);
}


TEST_F(TestMessgen, TestEmbeddedDynamicMessage) {
    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_embedded_dyn_d1_msg);

    messgen::MessageInfo msg_info{};
    messgen::msgs::messgen_test::embedded_dynamic_message_d1 parsed_embedded_dyn_msg{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, embedded_dynamic_message_d1::TYPE);
    ASSERT_EQ(messgen::parse(msg_info, parsed_embedded_dyn_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_embedded_dyn_d1_msg, parsed_embedded_dyn_msg);
}

TEST_F(TestMessgen, SimpleDetectorIntegrals) {
    static_assert(messgen::SimpleDetector<char>::is_simple_enough, "char");
    static_assert(messgen::SimpleDetector<uint8_t>::is_simple_enough, "uint8_t");
    static_assert(messgen::SimpleDetector<uint16_t>::is_simple_enough, "uint16_t");
    static_assert(messgen::SimpleDetector<uint32_t>::is_simple_enough, "uint32_t");
    static_assert(messgen::SimpleDetector<uint64_t>::is_simple_enough, "uint64_t");
    static_assert(messgen::SimpleDetector<int8_t>::is_simple_enough,"int8_t");
    static_assert(messgen::SimpleDetector<int16_t>::is_simple_enough, "int16_t");
    static_assert(messgen::SimpleDetector<int32_t>::is_simple_enough, "int32_t");
    static_assert(messgen::SimpleDetector<int64_t>::is_simple_enough, "int64_t");
    static_assert(messgen::SimpleDetector<float>::is_simple_enough, "float");
    static_assert(messgen::SimpleDetector<double>::is_simple_enough, "double");
    SUCCEED();
}

TEST_F(TestMessgen, SimpleDetectorDynamics) {
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<char>>::is_simple_enough, "char");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<uint8_t>>::is_simple_enough, "uint8_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<uint16_t>>::is_simple_enough, "uint16_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<uint32_t>>::is_simple_enough, "uint32_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<uint64_t>>::is_simple_enough, "uint64_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<int8_t>>::is_simple_enough,"int8_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<int16_t>>::is_simple_enough, "int16_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<int32_t>>::is_simple_enough, "int32_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<int64_t>>::is_simple_enough, "int64_t");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<float>>::is_simple_enough, "float");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<double>>::is_simple_enough, "double");
    SUCCEED();
}

TEST_F(TestMessgen, SimpleDetectorArrays) {
    static_assert(messgen::SimpleDetector<char[]>::is_simple_enough, "char");
    static_assert(messgen::SimpleDetector<uint8_t[]>::is_simple_enough, "uint8_t");
    static_assert(messgen::SimpleDetector<uint16_t[]>::is_simple_enough, "uint16_t");
    static_assert(messgen::SimpleDetector<uint32_t[]>::is_simple_enough, "uint32_t");
    static_assert(messgen::SimpleDetector<uint64_t[]>::is_simple_enough, "uint64_t");
    static_assert(messgen::SimpleDetector<int8_t[]>::is_simple_enough,"int8_t");
    static_assert(messgen::SimpleDetector<int16_t[]>::is_simple_enough, "int16_t");
    static_assert(messgen::SimpleDetector<int32_t[]>::is_simple_enough, "int32_t");
    static_assert(messgen::SimpleDetector<int64_t[]>::is_simple_enough, "int64_t");
    static_assert(messgen::SimpleDetector<float[]>::is_simple_enough, "float");
    static_assert(messgen::SimpleDetector<double[]>::is_simple_enough, "double");

    static_assert(false == messgen::SimpleDetector<std::string_view[2]>::is_simple_enough, "string_view");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<double>[4]>::is_simple_enough, "double");

    SUCCEED();
}

TEST_F(TestMessgen, SimpleDetectorStrings) {
    static_assert(messgen::SimpleDetector<char[5]>::is_simple_enough, "char");

    static_assert(false == messgen::SimpleDetector<std::string_view>::is_simple_enough, "string_view");
    static_assert(false == messgen::SimpleDetector<messgen::Dynamic<char>>::is_simple_enough, "dynamic char");

    SUCCEED();
}

TEST_F(TestMessgen, SimpleDetectorStructs) {
    static_assert(false == messgen::SimpleDetector<messgen::msgs::messgen_test::simple_message>::is_simple_enough, "simple_message");
    static_assert(false == messgen::SimpleDetector<messgen::msgs::messgen_test::implicit_padding>::is_simple_enough, "implicit_padding");
    static_assert(true == messgen::SimpleDetector<messgen::msgs::messgen_test::explicit_padding>::is_simple_enough, "explicit_padding");

    SUCCEED();
}

TEST_F(TestMessgen, UseExisting) {
    static_assert(true == messgen::SimpleDetector<entities::msgs::Existing>::is_simple_enough, "existing");
    static_assert(false == messgen::SimpleDetector<messgen::msgs::messgen_test::use_existing>::is_simple_enough, "use existing");
    static_assert(sizeof(uint32_t) == messgen::msgs::messgen_test::use_existing::STATIC_SIZE, "static size");
    static_assert(std::is_same<entities::msgs::Existing, super::duper::project::existing>::value, "aliasing");
    SUCCEED();
}

TEST_F(TestMessgen, UseOneExisting) {
    static_assert(true == messgen::SimpleDetector<messgen::msgs::messgen_test::use_one_existing>::is_simple_enough, "simple enough");
    static_assert(sizeof(entities::msgs::Existing) == messgen::msgs::messgen_test::use_one_existing::STATIC_SIZE, "same size");

    using namespace messgen::msgs::messgen_test;

    serialize_and_assert(_use_one_existing);

    messgen::MessageInfo msg_info{};

    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, use_one_existing::TYPE);

    messgen::msgs::messgen_test::use_one_existing parsed_use_one_existing_msg{};
    ASSERT_EQ(messgen::parse(msg_info, parsed_use_one_existing_msg, _messgen_alloc), msg_info.size);
    ASSERT_EQ(_use_one_existing, parsed_use_one_existing_msg);
}

TEST_F(TestMessgen, StorageSerialization) {
    using namespace messgen::msgs;

    messgen_test::simple_message simple_msg{gen_random_simple_msg()};
    messgen_test::simple_dynamic_message simple_dynamic_msg{gen_random_simple_dynamic_msg()};

    messgen::Storage<messgen_test::simple_message> simple_storage{simple_msg};
    messgen::Storage<messgen_test::simple_dynamic_message, 128> dynamic_storage{simple_dynamic_msg};

    std::vector<std::uint8_t> vec1;
    std::vector<std::uint8_t> vec2;
    vec1.reserve(16384);
    vec2.reserve(16384);

    serialize_and_assert_to_vec(simple_msg, vec1);
    serialize_and_assert_to_vec(simple_dynamic_msg, vec1);
    serialize_and_assert_to_vec(simple_storage, vec2);
    serialize_and_assert_to_vec(dynamic_storage, vec2);

    ASSERT_EQ(vec1, vec2);
}

TEST_F(TestMessgen, StorageParseTest) {
    using namespace messgen::msgs;

    // Serialize messages
    messgen_test::simple_message simple_msg{gen_random_simple_msg()};
    messgen_test::simple_dynamic_message dynamic_msg{gen_random_simple_dynamic_msg()};

    serialize_and_assert(simple_msg);
    serialize_and_assert(dynamic_msg);

    // Parse messages
    messgen::MessageInfo msg_info{};
    messgen::Storage<messgen_test::simple_message> simple_storage;
    messgen::Storage<messgen_test::simple_dynamic_message, 128> dynamic_storage;

    // Parse simple msg
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, messgen_test::simple_message::TYPE);
    ASSERT_EQ(messgen::parse(msg_info, simple_storage), msg_info.size);
    ASSERT_EQ(simple_msg, simple_storage);
    compact(_ser_buf, msg_info.get_total_size());

    // Parse simple dynamic msg
    ASSERT_EQ(messgen::stl::get_message_info(_ser_buf, msg_info), OK);
    ASSERT_EQ(msg_info.msg_id, messgen_test::simple_dynamic_message::TYPE);
    ASSERT_EQ(messgen::parse(msg_info, dynamic_storage), msg_info.size);
    ASSERT_EQ(dynamic_msg, dynamic_storage);
    compact(_ser_buf, msg_info.get_total_size());

    // Validate that buffer is empty
    ASSERT_EQ(_ser_buf.size(), 0);
}