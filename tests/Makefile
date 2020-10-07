PWD := $(shell pwd)
MESSAGES_YAML := ${wildcard messages/messgen/messgen_test/*.yaml}

CPP := g++
CPPFLAGS = -Wall -std=c++17 -O0 -g -c -I${PWD}/cpp -I${PWD}/../port/cpp
LDFLAGS = -pthread -lgtest

CPP_HEADERS := ${wildcard cpp/*.h} ${wildcard cpp/messgen/msgs/messgen_test/*.h}
CPP_SOURCES := ${wildcard cpp/*.cpp} ${wildcard cpp/messgen/msgs/messgen_test/*.cpp}
CPP_OBJECTS := ${CPP_SOURCES:.cpp=.o}

.PHONY: all cpp_tests_run messages clean

all: cpp_tests_run

messages: .done.messages
.done.messages: $(MESSAGES_YAML)
	python3 ../generate.py --basedirs $(shell pwd)/messages --modules messgen/messgen_test --outdir $(shell pwd)/cpp --lang cpp
	touch .done.messages

cpp_tests_run: cpp_tests_build
	./cpp_test.elf

cpp_tests_build: cpp_test.elf
cpp_test.elf: $(CPP_OBJECTS)
	$(CPP) -o cpp_test.elf $(CPP_OBJECTS) $(LDFLAGS)

$(CPP_OBJECTS): .done.messages $(CPP_HEADERS)

%.o: %.cpp
	$(CPP) $< $(CPPFLAGS) -o $@

clean:
	rm -f .done.messages
	rm -f ./cpp_test.elf
	rm -f $(MESSAGES_CPP)
	rm -f $(CPP_OBJECTS)
