#
# Function adds custom command for type generation for given modules
# Searches for TYPES in BASE_DIRS and generate files in OUT_DIR.
# List of generated files provided in OUT_FILES_VAR variable.
#
function(messgen_generate_types BASE_DIRS OUT_DIR OUT_FILES_VAR OPTIONS)
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)

    set(MESSGEN_INPUT_FILES "")
    set(OUT_FILES "")

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
                    list(APPEND OUT_FILES ${OUT_DIR}/${MSG_HEADER})
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
        OUTPUT ${OUT_FILES}
        COMMAND "python3"
        ARGS
        ${MESSGEN_DIR}/messgen-generate.py
        ${MESSGEN_ARGS}
        "--outdir" ${OUT_DIR}
        "--lang" "cpp"
        DEPENDS ${GENERATOR_DEPS} ${MESSGEN_INPUT_FILES}
    )
    set(${OUT_FILES_VAR} ${OUT_FILES} PARENT_SCOPE)
endfunction()

#
# Function adds custom command for protocol generation for give.
# Searches for PROTOCOL file and generates files in OUT_DIR.
# List of generated files provided in OUT_FILES_VAR variable.
#
function(messgen_generate_protocol BASE_DIR PROTOCOL OUT_DIR OUT_FILES_VAR)
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)

    set(PROTO_FILE "${BASE_DIR}/${PROTOCOL}.yaml")
    set(OUT_FILE "${OUT_DIR}/${PROTOCOL}.h")

    file(GLOB_RECURSE GENERATOR_DEPS ${MESSGEN_DIR}/*.py)
    add_custom_command(
        OUTPUT ${OUT_FILE}
        COMMAND "python3"
        ARGS
        ${MESSGEN_DIR}/messgen-generate.py
        "--protocol" "${BASE_DIR}:${PROTOCOL}"
        "--outdir" ${OUT_DIR}
        "--lang" "cpp"
        DEPENDS ${GENERATOR_DEPS} "${BASE_DIR}/${PROTOCOL}.yaml"
    )
    set(${OUT_FILES_VAR} ${OUT_FILE} PARENT_SCOPE)

endfunction()

#
# Function creates a target for specified types.
#
function(messgen_add_types_library LIBRARY_NAME BASE_DIRS MODE)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})
    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src")
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
function(messgen_add_proto_library LIBRARY_NAME BASE_DIR PROTOCOL TYPES_TARGET)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})
    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src")
    add_library(${LIBRARY_NAME} INTERFACE)
    messgen_generate_protocol(${BASE_DIR} ${PROTOCOL} "${MESSAGES_OUT_DIR}" MESSGEN_OUT_FILES)
    target_sources(${LIBRARY_NAME} INTERFACE ${MESSGEN_OUT_FILES})
    target_include_directories(${LIBRARY_NAME} INTERFACE ${MESSAGES_OUT_DIR})
    target_link_libraries(${LIBRARY_NAME} INTERFACE ${TYPES_TARGET})
endfunction()
