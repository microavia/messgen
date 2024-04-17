cmake_minimum_required(VERSION 3.5)

project(messgen)

set(MESSGEN_BASE_DIR "${CMAKE_CURRENT_LIST_DIR}/messages")

add_executable(test_cpp "cpp_stl/main.cpp")
messgen_add_library(msgs_test_proto "${MESSGEN_BASE_DIR}" "messgen/test_proto;another_proto" "stl" "cpp_standard=20")
target_link_libraries(test_cpp gtest msgs_test_proto)

add_executable(test_cpp_nostl "cpp_nostl/main.cpp")
messgen_add_library(msgs_test_proto_nostl "${MESSGEN_BASE_DIR}" "messgen/test_proto" "nostl" "cpp_standard=20")
target_link_libraries(test_cpp_nostl gtest msgs_test_proto_nostl)
