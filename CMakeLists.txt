cmake_minimum_required(VERSION 3.0)

project(messgen)

add_executable(test_cpp tests/cpp/main.cpp)

set_property(TARGET test_cpp PROPERTY CXX_STANDARD 20)
target_include_directories(test_cpp PUBLIC
        "out/cpp"
)
