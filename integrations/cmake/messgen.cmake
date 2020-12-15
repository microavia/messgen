#
# Function adds target for message generation for given modules
# Searches for MODULES in BASEDIRS and generate files in OUTDIR
#
# Provide MESSGEN_OUT_FILES variable which contains all C++ files for target to depend on
# You have to define global variable MESSGEN_DIR pointing to messgen root directory
#
FUNCTION(MESSGEN_GENERATE_MESSAGES BASEDIRS MODULES OUTDIR)
    SET(MESSGEN_INPUT_FILES "")
    SET(MESSGEN_OUT_FILES "")

    LIST(REMOVE_DUPLICATES MODULES)

    FOREACH (MODULE ${MODULES})
        SET(FOUND FALSE)
        FOREACH (BASEDIR ${BASEDIRS})
            SET(MESSAGES_PATH ${BASEDIR}/${MODULE})
            IF (EXISTS ${MESSAGES_PATH})
                SET(FOUND TRUE)

                STRING(FIND ${MODULE} "/" VENDOR_SEP_POS)
                IF (VENDOR_SEP_POS EQUAL -1)
                    MESSAGE(FATAL_ERROR "Messgen module must have the following format: vendor/module_name")
                ENDIF ()

                STRING(SUBSTRING ${MODULE} 0 ${VENDOR_SEP_POS} MODULE_VENDOR)
                STRING(SUBSTRING ${MODULE} ${VENDOR_SEP_POS} -1 MODULE_NAME)

                SET(MESSAGES_OUTDIR ${OUTDIR}/${MODULE_VENDOR}/msgs${MODULE_NAME})

                # This will trigger reconfiguration when messages definition changes
                # However this requires CMake >= 3.0. Need to change all configs with minimum required version
                set_property(
                        DIRECTORY
                        APPEND
                        PROPERTY CMAKE_CONFIGURE_DEPENDS
                        ${MESSAGES_PATH}
                )

                FILE(GLOB MODULE_MESSAGES RELATIVE ${MESSAGES_PATH} ${MESSAGES_PATH}/*.yaml)
                LIST(REMOVE_ITEM MODULE_MESSAGES "_protocol.yaml")
                LIST(REMOVE_ITEM MODULE_MESSAGES "_constants.yaml")
                LIST(REMOVE_ITEM MODULE_MESSAGES "_types.yaml")

                IF (MODULE_MESSAGES)
                    FOREACH (MSG_YAML ${MODULE_MESSAGES})
                        STRING(REGEX REPLACE "(yaml)" "h" MSG_HEADER ${MSG_YAML})
                        STRING(REGEX REPLACE "(yaml)" "cpp" MSG_CPP ${MSG_YAML})

                        LIST(APPEND MESSGEN_INPUT_FILES ${MESSAGES_PATH}/${MSG_YAML})

                        LIST(APPEND MESSGEN_OUT_FILES ${MESSAGES_OUTDIR}/${MSG_HEADER})
                        LIST(APPEND MESSGEN_OUT_FILES ${MESSAGES_OUTDIR}/${MSG_CPP})
                    ENDFOREACH ()
                ENDIF ()

                LIST(APPEND MESSGEN_INPUT_FILES
                        ${MESSAGES_PATH}/_protocol.yaml
                        ${MESSAGES_PATH}/_constants.yaml
                        )

                LIST(APPEND MESSGEN_OUT_FILES
                        ${MESSAGES_OUTDIR}/proto.h
                        ${MESSAGES_OUTDIR}/messages.h
                        ${MESSAGES_OUTDIR}/constants.h
                        )
            ENDIF ()
        ENDFOREACH ()

        IF (NOT FOUND)
            MESSAGE(FATAL_ERROR "Messages for module ${MODULE} not found! Searched in: ${BASEDIRS}")
        ENDIF ()
    ENDFOREACH ()

    SET(MESSGEN_OUT_FILES ${MESSGEN_OUT_FILES} PARENT_SCOPE)

    IF (MESSGEN_OUT_FILES)
        FILE(GLOB_RECURSE GENERATOR_DEPS ${MESSGEN_DIR}/*.py)
        ADD_CUSTOM_COMMAND(
                OUTPUT ${MESSGEN_OUT_FILES}
                COMMAND "python3"
                ARGS
                ${MESSGEN_DIR}/generate.py
                "-b"
                ${BASEDIRS}
                "-m"
                ${MODULES}
                "-o"
                ${OUTDIR}
                "-l"
                "cpp"
                DEPENDS
                ${GENERATOR_DEPS}
                ${MESSGEN_INPUT_FILES}
        )
    ENDIF ()
ENDFUNCTION()
