cmake_minimum_required(VERSION 3.0)

project(messgen)

add_executable(test_cpp tests/cpp/main.cpp)
set_property(TARGET test_cpp PROPERTY CXX_STANDARD 20)
target_include_directories(test_cpp PUBLIC
        "port/cpp"
        "out/cpp"
)
target_link_libraries(test_cpp gtest)

add_executable(test_cpp_nostl tests/cpp_nostl/main.cpp)
set_property(TARGET test_cpp_nostl PROPERTY CXX_STANDARD 20)
target_include_directories(test_cpp_nostl PUBLIC
        "port/cpp_nostl"
        "out/cpp_nostl"
)
target_link_libraries(test_cpp_nostl gtest)
