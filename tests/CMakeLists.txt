include(GoogleTest)
find_package(GTest REQUIRED)

enable_testing()

set(MESSGEN_BASE_DIR "${CMAKE_CURRENT_LIST_DIR}/messages")

add_executable(test_cpp "cpp/CppTest.cpp")
messgen_add_library(msgs_test_proto "${MESSGEN_BASE_DIR}" "messgen/test_proto;another_proto" "stl" "cpp_standard=20")
target_link_libraries(test_cpp gtest msgs_test_proto GTest::gtest_main)
gtest_discover_tests(test_cpp)

add_executable(test_cpp_nostl "cpp/CppNostlTest.cpp")
messgen_add_library(msgs_test_proto_nostl "${MESSGEN_BASE_DIR}" "messgen/test_proto" "nostl" "cpp_standard=20")
target_link_libraries(test_cpp_nostl gtest msgs_test_proto_nostl GTest::gtest_main)
gtest_discover_tests(test_cpp_nostl)

# Make executables form the same source files but without "cpp_standard=20" option (messgen may work differently)

add_executable(test_cpp_17 "cpp/CppTest.cpp")
messgen_add_library(msgs_test_proto_cpp17 "${MESSGEN_BASE_DIR}" "messgen/test_proto;another_proto" "stl")
target_link_libraries(test_cpp_17 gtest msgs_test_proto_cpp17 GTest::gtest_main)
gtest_discover_tests(test_cpp_17)

add_executable(test_cpp_17_nostl "cpp/CppNostlTest.cpp")
messgen_add_library(msgs_test_proto_nostl_cpp17 "${MESSGEN_BASE_DIR}" "messgen/test_proto" "nostl")
target_link_libraries(test_cpp_17_nostl gtest msgs_test_proto_nostl_cpp17 GTest::gtest_main)
gtest_discover_tests(test_cpp_17_nostl)
