cmake_minimum_required(VERSION 3.5)

project(messgen)

set(CMAKE_CXX_STANDARD 20)

include("integrations/cmake/messgen.cmake")

add_subdirectory(tests)
