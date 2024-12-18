ROOT_DIR ?= $(realpath $(PWD))
BUILD_DIR ?= $(ROOT_DIR)/build
BUILD_TYPE ?= Debug

all: check

configure:
	cmake -B${BUILD_DIR} -S. -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=1 -DCMAKE_BUILD_TYPE=${BUILD_TYPE}

build: configure
	cmake --build ${BUILD_DIR}

test: build
	ctest --test-dir ${BUILD_DIR}/tests/ --output-on-failure
	python3 -m pytest .

check: test
	python3 -m mypy .

clean:
	rm -rf ${BUILD_DIR}

