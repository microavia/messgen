#
# Function adds target for message generation for given modules
# Searches for MODULES in BASEDIRS and generate files in OUTDIR
#
# Provide MESSGEN_OUT_FILES variable which contains all C++ files for target to depend on
# You have to define global variable MESSGEN_DIR pointing to messgen root directory
#
function(MESSGEN_GENERATE_MESSAGES BASEDIRS MODULES OUTDIR OUTFILES_VAR)
    set(MESSGEN_INPUT_FILES "")
    set(OUTFILES "")

    list(REMOVE_DUPLICATES MODULES)

    foreach (MODULE ${MODULES})
        set(FOUND FALSE)
        foreach (BASEDIR ${BASEDIRS})
            set(MESSAGES_PATH ${BASEDIR}/${MODULE})
            if (EXISTS ${MESSAGES_PATH})
                set(FOUND TRUE)

                set(MESSAGES_OUTDIR ${OUTDIR}/${MODULE})

                # This will trigger reconfiguration when messages definition changes
                # However this requires CMake >= 3.0. Need to change all configs with minimum required version
                set_property(
                        DIRECTORY
                        APPEND
                        PROPERTY CMAKE_CONFIGURE_DEPENDS
                        ${MESSAGES_PATH}
                )

                file(GLOB MODULE_MESSAGES RELATIVE ${MESSAGES_PATH} ${MESSAGES_PATH}/*.yaml)
                list(REMOVE_ITEM MODULE_MESSAGES "_protocol.yaml")

                if (MODULE_MESSAGES)
                    foreach (MSG_YAML ${MODULE_MESSAGES})
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
            message(FATAL_ERROR "Messages for module ${MODULE} not found! Searched in: ${BASEDIRS}")
        endif ()
    endforeach ()

    if (OUTFILES)
        file(GLOB_RECURSE GENERATOR_DEPS ${MESSGEN_DIR}/*.py)
        add_custom_command(
                OUTPUT ${OUTFILES}
                COMMAND "python3"
                ARGS
                ${MESSGEN_DIR}/messgen.py
                "--basedir" ${BASEDIRS}
                "--protocol" ${MODULES}
                "--outdir" ${OUTDIR}
                "--lang" "cpp"
                DEPENDS ${GENERATOR_DEPS} ${MESSGEN_INPUT_FILES}
        )
    endif ()
    set(${OUTFILES_VAR} ${OUTFILES} PARENT_SCOPE)
endfunction()
