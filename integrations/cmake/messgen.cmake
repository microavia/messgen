#
# Function adds custom command for message generation for given modules
# Searches for PROTOCOLS in BASE_DIRS and generate files in OUTDIR.
# List of generated files provided in OUTFILES_VAR variable.
#
function(messgen_generate_types BASE_DIRS OUTDIR OUTFILES_VAR OPTIONS)
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    set(MESSGEN_INPUT_FILES "")
    set(OUTFILES "")

    set(MESSGEN_ARGS "")
    foreach (BASE_DIR ${BASE_DIRS})
        list(APPEND MESSGEN_ARGS "--types" ${BASE_DIR})
    endforeach ()

    foreach (TYPES_PATH ${BASE_DIRS})
        if (EXISTS ${TYPES_PATH})
            # This will trigger reconfiguration when messages definition changes
            # However this requires CMake >= 3.0. Need to change all configs with minimum required version
            set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS ${TYPES_PATH})

            file(GLOB_RECURSE TYPES RELATIVE ${TYPES_PATH} ${TYPES_PATH}/*.yaml)

            if (TYPES)
                foreach (TYPE_YAML ${TYPES})
                    string(REGEX REPLACE "(yaml)" "h" MSG_HEADER ${TYPE_YAML})
                    string(REGEX REPLACE "(yaml)" "cpp" MSG_CPP ${TYPE_YAML})

                    list(APPEND MESSGEN_INPUT_FILES ${TYPES_PATH}/${TYPE_YAML})
                    list(APPEND OUTFILES ${OUTDIR}/${MSG_HEADER})
                endforeach ()
            endif ()
        endif ()
    endforeach ()

    if (OPTIONS)
        list(APPEND MESSGEN_ARGS "--options")
        list(APPEND MESSGEN_ARGS ${OPTIONS})
    endif ()

    file(GLOB_RECURSE GENERATOR_DEPS ${MESSGEN_DIR}/*.py)
    add_custom_command(
        OUTPUT ${OUTFILES}
        COMMAND "python3"
        ARGS
        ${MESSGEN_DIR}/messgen-generate.py
        ${MESSGEN_ARGS}
        "--outdir" ${OUTDIR}
        "--lang" "cpp"
        DEPENDS ${GENERATOR_DEPS} ${MESSGEN_INPUT_FILES}
    )
    set(${OUTFILES_VAR} ${OUTFILES} PARENT_SCOPE)
endfunction()


function(messgen_generate_protocol BASE_DIRS PROTOCOLS OUTDIR OUTFILES_VAR)
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    set(MESSGEN_INPUT_FILES "")
    set(OUTFILES "")

    foreach (BASE_DIR ${BASE_DIRS})
        list(APPEND MESSGEN_ARGS "--protocols" ${BASE_DIR})
    endforeach ()

    foreach (PROTOCOLS_PATH ${BASE_DIRS})
        if (EXISTS ${PROTOCOLS_PATH})
            # This will trigger reconfiguration when messages definition changes
            # However this requires CMake >= 3.0. Need to change all configs with minimum required version
            set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS ${PROTOCOLS_PATH})

            file(GLOB PROTOCOLS RELATIVE ${PROTOCOLS_PATH} ${PROTOCOLS_PATH}/*.yaml)

            if (PROTOCOLS)
                foreach (PROTO_YAML ${PROTOCOLS})
                    string(REGEX REPLACE "(yaml)" "h" PROTO_HEADER ${PROTO_YAML})
                    string(REGEX REPLACE "(yaml)" "cpp" PROTO_CPP ${PROTO_YAML})

                    list(APPEND MESSGEN_INPUT_FILES ${PROTOCOLS_PATH}/${PROTO_YAML})
                    list(APPEND OUTFILES ${OUTDIR}/${PROTO_HEADER})
                endforeach ()
            endif ()
        endif ()
    endforeach ()

    file(GLOB_RECURSE GENERATOR_DEPS ${MESSGEN_DIR}/*.py)
    add_custom_command(
        OUTPUT ${OUTFILES}
        COMMAND "python3"
        ARGS
        ${MESSGEN_DIR}/messgen-generate.py
        ${MESSGEN_ARGS}
        "--outdir" ${OUTDIR}
        "--lang" "cpp"
        DEPENDS ${GENERATOR_DEPS} ${MESSGEN_INPUT_FILES}
    )
    set(${OUTFILES_VAR} ${OUTFILES} PARENT_SCOPE)

endfunction()

#
# Function creates a target for specified types.
#
function(messgen_add_types_library LIBRARY_NAME BASE_DIRS MODE)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})
    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src/types")
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    add_library(${LIBRARY_NAME} INTERFACE)
    messgen_generate_types("${BASE_DIRS}" "${MESSAGES_OUT_DIR}" MESSGEN_OUT_FILES "${OPTIONS}")
    target_sources(${LIBRARY_NAME} INTERFACE ${MESSGEN_OUT_FILES})
    target_include_directories(${LIBRARY_NAME} INTERFACE
        ${MESSAGES_OUT_DIR}
        ${MESSGEN_DIR}/port/cpp_${MODE})
endfunction()

#
# Function creates a target for specified protocol.
#
function(messgen_add_protocol_library LIBRARY_NAME BASE_DIRS PROTOCOL TYPES_TARGET)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})
    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src/protocols")
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    add_library(${LIBRARY_NAME} INTERFACE)
    messgen_generate_protocol("${BASE_DIRS}" "${PROTOCOL}" "${MESSAGES_OUT_DIR}" MESSGEN_OUT_FILES)
    target_sources(${LIBRARY_NAME} INTERFACE ${MESSGEN_OUT_FILES})
    target_include_directories(${LIBRARY_NAME} INTERFACE ${MESSAGES_OUT_DIR})
    target_link_libraries(${LIBRARY_NAME} INTERFACE ${TYPES_TARGET})
endfunction()
