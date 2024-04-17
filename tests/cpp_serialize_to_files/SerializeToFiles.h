#pragma once

#include <messgen/test_proto/complex_struct.h>
#include <messgen/test_proto/complex_struct_nostl.h>
#include <messgen/test_proto/flat_struct.h>
#include <messgen/test_proto/simple_struct.h>

#include <fstream>
#include <iostream>

template<class MSG>
static bool dump_to_file(const MSG& msg, const std::string& output_file_path) {
    const size_t sz_check = msg.serialized_size();
    std::vector<uint8_t> buf;

    buf.resize(sz_check);
    size_t ser_size = msg.serialize(buf.data());
    if (ser_size != sz_check) {
        std::cerr << "Serialization failed" << std::endl;
        return false;
    }

    // open file "output_path/msg.bin" but using proper path separator
    std::ofstream fs(output_file_path, std::ios::binary);
    if (!fs.is_open()) {
        std::cerr << "Failed to open" << output_file_path << std::endl;
        return false;
    }

    fs << std::string_view(reinterpret_cast<const char*>(buf.data()), buf.size());
    fs.close();
    if (fs.fail()) {
        std::cerr << "Failed to write to" << output_file_path << std::endl;
        return false;
    }

    std::cout << "Dumped to " << output_file_path << " (" << ser_size << " bytes)\n";

    return true;
}

#define DUMP_MSG(M) dump_to_file(M, output_dir + "/" #M ".bin")

static bool serialize_to_files(const std::string& output_dir) {
    bool result = true;
    using namespace messgen::test_proto;

    flat_struct flat_struct {
        .f0 = 123'456'789'012'345,
        .f1 = 123'456'789'012'346,
        .f2 = -123.45,
        .f3 = 123'456'789,
        .f4 = -123'456'789,
        .f5 = 123.45,
        .f6 = 12345,
        .f7 = 123,
        .f8 = -123
    };
    result &= DUMP_MSG(flat_struct);

    complex_struct complex_struct {
        .f0 = 1234567890123456789,
        .f1 = 1234567890,
        .f2 = 9876543210987654321ull,
        .s_arr = {
            simple_struct{1001, -1001, 255, 3.14159265, 4294967295, -2147483648, 1.234f, 65535, 255, -128, true},
            simple_struct{2002, -2002, 0, 2.71828182, 1234567890, 2000000000, 2.718f, 12345, 0, 127, false}
        },
        .f1_arr = {100, 200, 300, 400},
        .v_arr = {
            var_size_struct{111, {1, 2, 3}, "Hello"},
            var_size_struct{222, {4, 5, 6, 7}, "World"}
        },
        .f2_vec = {1.1, 2.2, 3.3, 4.4, 5.5},
        .e_vec = {simple_enum::one_value, simple_enum::another_value},
        .s_vec = {
            simple_struct{3003, -3003, 100, 1.61803399, 987654321, 2147483647, 3.333f, 54321, 100, -111, true}
        },
        .v_vec0 = {
            {
                var_size_struct{333, {7, 8, 9}, "Test"},
                var_size_struct{444, {10, 11, 12, 13}, "Data"}
            }
        },
        .v_vec1 = {
            std::vector<var_size_struct>{{var_size_struct{555, {14, 15}, "Foo"}}},
            std::vector<var_size_struct>{{var_size_struct{666, {16, 17, 18}, "The next struct has empty string"},
                                          var_size_struct{999, {-16, -17, -18}, ""}}},
            std::vector<var_size_struct>{},
            std::vector<var_size_struct>{{var_size_struct{777, {19, 20, 21, 22}, "Baz"}}}
        },
        .v_vec2 = {
            {{std::vector<int16_t>{1, 2}, std::vector<int16_t>{3, 4}, std::vector<int16_t>{5, 6}, std::vector<int16_t>{7, 8}}},
            {{std::vector<int16_t>{9, 10}, std::vector<int16_t>{11, 12}, std::vector<int16_t>{13, 14}, std::vector<int16_t>{15, 16}}},
            {{std::vector<int16_t>{17, 18}, std::vector<int16_t>{19, 20}, std::vector<int16_t>{21, 22}, std::vector<int16_t>{23, 24}}},
            {{std::vector<int16_t>{25, 26}, std::vector<int16_t>{27, 28}, std::vector<int16_t>{29, 30}, std::vector<int16_t>{31, 32}}}
        },
        .str = "Example String",
        .bs = {0x01, 0x02, 0x03, 0x04},
        .str_vec = {"string1", "string2", "string3"},
        .map_str_by_int = {{101, "One"}, {102, "Two"}},
        .map_vec_by_str = {{"key1", {1, 2, 3}}, {"key2", {4, 5, 6}}}
    };
    result &= DUMP_MSG(complex_struct);

    return result;
}