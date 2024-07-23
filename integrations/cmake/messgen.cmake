#
# Function adds custom command for message generation for given modules
# Searches for PROTOCOLS in BASE_DIRS and generate files in OUTDIR.
# List of generated files provided in OUTFILES_VAR variable.
#
function(messgen_generate_messages BASE_DIRS PROTOCOLS OUTDIR OUTFILES_VAR OPTIONS)
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    set(MESSGEN_INPUT_FILES "")
    set(OUTFILES "")

    list(REMOVE_DUPLICATES PROTOCOLS)

    set(MESSGEN_ARGS "")
    foreach (BASE_DIR ${BASE_DIRS})
        list(APPEND MESSGEN_ARGS "--basedir")
        list(APPEND MESSGEN_ARGS ${BASE_DIR})
    endforeach ()

    foreach (PROTOCOL ${PROTOCOLS})
        set(FOUND FALSE)
        foreach (BASE_DIR ${BASE_DIRS})
            set(MESSAGES_PATH ${BASE_DIR}/${PROTOCOL})
            if (EXISTS ${MESSAGES_PATH})
                set(FOUND TRUE)

                set(MESSAGES_OUTDIR ${OUTDIR}/${PROTOCOL})

                # This will trigger reconfiguration when messages definition changes
                # However this requires CMake >= 3.0. Need to change all configs with minimum required version
                set_property(
                        DIRECTORY
                        APPEND
                        PROPERTY CMAKE_CONFIGURE_DEPENDS
                        ${MESSAGES_PATH}
                )

                file(GLOB PROTOCOL_MESSAGES RELATIVE ${MESSAGES_PATH} ${MESSAGES_PATH}/*.yaml)
                list(REMOVE_ITEM PROTOCOL_MESSAGES "_protocol.yaml")

                if (PROTOCOL_MESSAGES)
                    foreach (MSG_YAML ${PROTOCOL_MESSAGES})
                        string(REGEX REPLACE "(yaml)" "h" MSG_HEADER ${MSG_YAML})
                        string(REGEX REPLACE "(yaml)" "cpp" MSG_CPP ${MSG_YAML})

                        list(APPEND MESSGEN_INPUT_FILES ${MESSAGES_PATH}/${MSG_YAML})

                        list(APPEND OUTFILES ${MESSAGES_OUTDIR}/${MSG_HEADER})
                    endforeach ()
                endif ()

                list(APPEND MESSGEN_INPUT_FILES
                        ${MESSAGES_PATH}/_protocol.yaml
                )

                list(APPEND OUTFILES
                        ${MESSAGES_OUTDIR}/proto.h
                )
            endif ()
        endforeach ()

        if (NOT FOUND)
            message(FATAL_ERROR "Protocol ${PROTOCOL} not found! Searched in: ${BASE_DIRS}")
        endif ()

        list(APPEND MESSGEN_ARGS "--protocol")
        list(APPEND MESSGEN_ARGS ${PROTOCOL})
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

#
# Function creates a target for specified protocols.
#
function(messgen_add_library LIBRARY_NAME BASE_DIRS PROTOCOLS MODE)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})
    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src")
    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)
    add_library(${LIBRARY_NAME} INTERFACE)
    messgen_generate_messages("${BASE_DIRS}" "${PROTOCOLS}" "${MESSAGES_OUT_DIR}" MESSGEN_OUT_FILES "${OPTIONS}")
    target_sources(${LIBRARY_NAME} INTERFACE ${MESSGEN_OUT_FILES})
    target_include_directories(${LIBRARY_NAME} INTERFACE "${MESSAGES_OUT_DIR}" "${MESSGEN_DIR}/port/cpp/common" "${MESSGEN_DIR}/port/cpp/${MODE}")
endfunction()
