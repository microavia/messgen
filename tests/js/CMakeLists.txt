cmake_minimum_required(VERSION 3.16)
project(main)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_VERBOSE_MAKEFILE ON)

set(CPP_PORT_DIRECTORY ../../port/cpp)
set(MSGS_DIRECTORY msgs)

set(SOURCE_EXE main.cpp)

add_executable(main ${SOURCE_EXE})

target_include_directories(main PRIVATE ${CPP_PORT_DIRECTORY})
target_include_directories(main PRIVATE ${MSGS_DIRECTORY})