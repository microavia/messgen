#include <messgen_dynamic/MessgenDynamic.h>

#include <iostream>

int main(int argc, char **argv) {
    DynamicParser parser("tests/messages/messgen/test_proto");
    auto &msg = parser.add_message("simple_struct");
    auto f4 = msg.add_scalar_field<int32_t>("f4");
    auto foo = msg.add_scalar_field<int32_t>("foo");
    //
    // parser.update(23, reinterpret_cast<const uint8_t *>("ddd"));
    // if (msg_test.is_updated()) {
    //     std::cout << "Updated " << msg_test.name() << std::endl;
    // }

    return 0;
}
