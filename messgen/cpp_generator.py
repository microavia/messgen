import os

PROTO_ID_VAR_TYPE = "uint8_t"
PROTO_MAX_MESSAGE_SIZE_TYPE = "uint32_t"
MESSGEN_NAMESPACE = "messgen"

MESSAGE_ID_C_TYPE = "uint8_t"
MESSAGE_SIZE_C_TYPE = "size_t"
MESSAGE_PROTO_C_TYPE = "uint8_t"

TYPE_FIELD_SIZE = 1
DYN_FIELD_LEN_SIZE = 2
INPUT_BUF_NAME = "buf"
INPUT_ALLOC_NAME = "allocator"
INDENT = "    "

PLAIN2CPP_TYPES_MAP = {
    "char": "char",
    "uint8": "uint8_t",
    "uint16": "uint16_t",
    "uint32": "uint32_t",
    "uint64": "uint64_t",
    "int8": "int8_t",
    "int16": "int16_t",
    "int32": "int32_t",
    "int64": "int64_t",
    "float32": "float",
    "float64": "double",
}


def to_cpp_type(_type):
    if _type in PLAIN2CPP_TYPES_MAP:
        return PLAIN2CPP_TYPES_MAP[_type]
    else:
        return _type.replace("/", "::")


def to_cpp_type_short(_type):
    if _type in PLAIN2CPP_TYPES_MAP:
        return PLAIN2CPP_TYPES_MAP[_type]
    else:
        return _type.split("/")[-1]


def make_module_include(module, file):
    return "#include <%s/%s.h>" % (module["namespace"], file)


def make_include(file):
    return "#include \"%s\"" % file


def make_variable(name, type, array_size):
    var = type + " " + name
    if array_size > 0:
        var += "[" + str(array_size) + "]"
    var += ";"

    return var


def open_namespace(module_namespace):
    code = []
    namespaces = module_namespace.split("::")
    for ns in namespaces:
        code.append("namespace %s {" % ns)

    return code


def close_namespace(namespace):
    code = []
    namespaces = namespace.split("::")
    for ns in namespaces:
        code.append("} // %s" % ns)

    code.append("")
    return code


def make_enum(name, basetype, fields):
    enum = ["enum %s : %s {" % (name, basetype)]

    for field in fields:
        enum.append("\t%s = %s," % (str(field["name"]).upper(), field["value"]))
    enum.append("};")

    return enum


def memcpy(dst, src, size):
    return "memcpy(%s, %s, %s);" % (dst, src, size)


def set_inc_var(name, value):
    return "%s += %s;" % (name, value)


def set_dec_var(name, value):
    return "%s -= %s;" % (name, value)


def set_var(name, value):
    return "%s = %s;" % (name, value)


def ignore_variable(var):
    return "(void)%s;" % var


def simplify_type_namespace(typename, current_namespace):
    typename_entries = typename.split("::")
    ns_entries = current_namespace.split("::")

    iter_size = min(len(typename_entries), len(ns_entries))

    i = 0
    while typename_entries[i] == ns_entries[i]:
        i += 1

    new_typename_entries = typename_entries[i:]
    return "".join([entry for entry in new_typename_entries])


def write_code_file(fpath, code):
    with open(fpath, "w+") as f:
        for line in code:
            f.write(line + os.linesep)


def generate_messages_file(includes):
    file = [
        "#pragma once",
        "",
        *includes,
        ""
    ]

    return file


def generate_constants_file(namespace, constants):
    code = [
        "#pragma once",
        "",
        "#include <cstdint>",
        "",
        *open_namespace(namespace),
    ]

    for const in constants:
        code.extend(make_enum(const["name"], to_cpp_type(const["basetype"]), const["fields"]))

    code.extend(close_namespace(namespace))
    return code


def generate_proto_file(namespace, module):
    proto_id = module["proto_id"]
    max_msg_size = module["max_datatype_size"]

    struct = ["struct ProtoInfo {",
              "    static constexpr %s ID = %d;" % (PROTO_ID_VAR_TYPE, proto_id),
              "    static constexpr %s MAX_MESSAGE_SIZE = %d;" % (PROTO_MAX_MESSAGE_SIZE_TYPE, max_msg_size),
              "};"]

    code = [
        "#pragma once",
        "",
        *open_namespace(namespace),
        "",
        *struct,
        "",
        "static constexpr %s PROTO_ID = %d;" % (PROTO_ID_VAR_TYPE, proto_id),
        "static constexpr %s PROTO_MAX_MESSAGE_SIZE = %d;" % (PROTO_MAX_MESSAGE_SIZE_TYPE, max_msg_size),
        "",
        *close_namespace(namespace)
    ]

    return code


def get_dyn_field_ptr(field):
    return field["name"] + ".ptr"


def get_dyn_field_size(field):
    return field["name"] + ".size"


def get_dyn_field_vars(field):
    return get_dyn_field_ptr(field), get_dyn_field_size(field)


def allocate_memory(dst, type, size):
    return ["%s = %s.alloc<%s>(%s);" % (dst, INPUT_ALLOC_NAME, type, str(size)),
            "if (%s == nullptr) {return 0;}" % dst]


def get_dynamic_field_items_num():
    size = ""
    for i in range(DYN_FIELD_LEN_SIZE):
        shift_str = "(ptr[%d] << (%dU*8U))" % (i, i)
        size += " " + shift_str + " |"

    return size[:-2]


def get_mem_size(dynamic_field_len, dyn_type):
    return "%s * sizeof(%s)" % (str(dynamic_field_len), dyn_type)


class CppGenerator:
    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map

        self._indent_cnt = 0
        self._indent = ""
        self._code = []

    def generate(self, out_dir):
        for module_name, module in self._modules_map.items():
            module_out_dir = out_dir + os.path.sep + module["namespace"].replace(self.MODULE_SEP, os.path.sep)

            try:
                os.makedirs(module_out_dir)
            except:
                pass

            namespace = module["namespace"].replace(self.MODULE_SEP, "::")

            proto_file = generate_proto_file(namespace, module)
            proto_fpath = module_out_dir + os.path.sep + "proto.h"
            write_code_file(proto_fpath, proto_file)

            all_includes = []

            for message in module["messages"]:
                header_file = self.__generate_message_header(namespace, message)
                header_fpath = module_out_dir + os.path.sep + message["name"] + ".h"
                write_code_file(header_fpath, header_file)

                source_file = self.__generate_message_source(namespace, message)
                source_fpath = module_out_dir + os.path.sep + message["name"] + ".cpp"
                write_code_file(source_fpath, source_file)

                cpp_include_path = make_module_include(module, message["name"])
                all_includes.append(cpp_include_path)

            all_includes.append(make_include("proto.h"))
            all_includes.append(make_include("constants.h"))

            # Messages.h
            messages_file = generate_messages_file(all_includes)
            messages_fpath = module_out_dir + os.path.sep + "messages.h"
            write_code_file(messages_fpath, messages_file)

            constants = module.get("constants")
            if constants is None:
                constants = []

            constants_file = generate_constants_file(namespace, constants)
            constants_fpath = module_out_dir + os.path.sep + "constants.h"
            write_code_file(constants_fpath, constants_file)

    def __generate_message_header(self, namespace, message):
        self.reset()
        msg_struct, msg_includes = self.generate_message(message)

        header = [
            "#pragma once",
            "",
            *msg_includes,
            "",
            "",
            *open_namespace(namespace),
            "",
            *msg_struct,
            "",
            *close_namespace(namespace)
        ]

        return header

    def __generate_message_source(self, namespace, message):
        self.reset()

        source = [
            make_include(message["name"] + ".h"),
            "",
            *open_namespace(namespace),
            "",
            *self.generate_metadata(message),
            "",
            *close_namespace(namespace)
        ]

        return source

    def generate_message(self, message_obj):
        data_type = self._data_types_map[message_obj["typename"]]
        msg_static_size = data_type["static_size"]

        message_id_const = "static constexpr %s TYPE = %d;" % \
                           (MESSAGE_ID_C_TYPE, message_obj["id"])
        message_size_const = "static constexpr %s STATIC_SIZE = %d; /*<! Plain fields size + dynamic fields length */" % \
                             (MESSAGE_SIZE_C_TYPE, msg_static_size)
        message_proto_id_const = "static constexpr %s PROTO = PROTO_ID;" % MESSAGE_PROTO_C_TYPE

        self.start_block("struct " + message_obj["name"])
        self.extend([
            message_id_const,
            message_size_const,
            message_proto_id_const,
            ""
        ])

        self.generate_data_fields(data_type["fields"])
        self.append("")

        cpp_typename = message_obj["typename"].replace("/", "::")
        self.generate_compare_operator(cpp_typename, data_type)
        self.append("")

        self.generate_serialize_method(message_obj)
        self.append("")

        self.generate_parse_method(message_obj)
        self.append("")

        self.generate_get_size_method(message_obj)
        self.append("")

        self.generate_get_dynamic_size_method(message_obj)
        self.append("")

        self.append("static const messgen::Metadata METADATA;")
        self.append("")

        self.stop_block(";")

        includes = ["#include <cstdint>",
                    "#include <cstring>",
                    "#include <messgen/Metadata.h>",
                    "#include <messgen/Dynamic.h>",
                    "#include <messgen/MemoryAllocator.h>",
                    "#include \"proto.h\"",
                    "#include \"constants.h\""
                    ]

        for dep in message_obj["deps"]:
            inc = "#include <" + dep + ".h>"
            includes.append(inc)

        return list(self._code), includes


    def generate_get_size_method(self, message_obj):
        self.start_block("size_t get_size() const")
        self.extend([
            "return STATIC_SIZE + get_dynamic_size();"
        ])
        self.stop_block()


    def generate_get_dynamic_size_method(self, message_obj):
        self.start_block("size_t get_dynamic_size() const")
        self.append("size_t size = 0;")

        for field in message_obj["fields"]:
            typeinfo = self._data_types_map[field["type"]]

            if field["is_array"]:
                if typeinfo["plain"] and field["is_dynamic"]:
                    dyn_len_var = get_dyn_field_size(field)
                    mem_size = dyn_len_var + "*" + str(typeinfo["static_size"])
                    self.append(set_inc_var("size", mem_size))

                elif not typeinfo["plain"]:
                    if field["is_dynamic"]:
                        size_limit = get_dyn_field_size(field)
                        ptr = "%s.ptr" % field["name"]
                        size_func = "get_size"
                    else:
                        size_limit = str(field["num"])
                        ptr = field["name"]
                        size_func = "get_dynamic_size"

                    self.start_for_cycle(size_limit)
                    self.append(set_inc_var("size", "%s[i].%s()" % (ptr, size_func)))
                    self.stop_cycle()
            
            elif not typeinfo["plain"]:
                self.append(set_inc_var("size", "%s.get_dynamic_size()" % field["name"]))
                    

        self.append("return size;")
        self.stop_block()

    def generate_compare_operator(self, typename, datatype):
        self.start_block("bool operator== (const " + typename + "& " + "other) const")

        if len(datatype["fields"]) == 0:
            self.append("return true;")
            self.stop_block()
        else:
            for field in datatype["fields"]:
                typeinfo = self._data_types_map[field["type"]]

                if not field["is_array"]:
                    self.append("if (!(%s == other.%s)) {return false;}" % (field["name"], field["name"]))
                else:
                    if field["is_dynamic"]:
                        self.append("if (%s.size != other.%s.size) {return false;}" % (field["name"], field["name"]))
                        ptr, num = get_dyn_field_vars(field)
                    else:
                        ptr = field["name"]
                        num = field["num"]

                    if typeinfo["plain"]:
                        memcmp = "memcmp(%s, other.%s, %s * %s)" % (ptr, ptr, typeinfo["static_size"], num)
                        self.append("if (%s != 0) {return false;}" % memcmp)
                    else:
                        self.start_for_cycle(num)
                        self.append("if (!(%s[i] == other.%s[i])) {return false;}" % (ptr, ptr))
                        self.stop_cycle()
                        
                self.append("")

            self.append("return true;")
            self.stop_block()

    def generate_serialize_method(self, message):
        self.start_block("size_t serialize_msg(uint8_t *%s) const" % INPUT_BUF_NAME)
        self.extend([
            "uint8_t * ptr = %s;" % INPUT_BUF_NAME,
            ""
        ])

        first_field_ptr = None
        copy_size = 0

        dynamic_field_id = 0
        for field in message["fields"]:
            typeinfo = self._data_types_map[field["type"]]

            if field["is_dynamic"] or not typeinfo["plain"]:
                if copy_size != 0:
                    self.extend([
                        memcpy("ptr", first_field_ptr, copy_size),
                        set_inc_var("ptr", copy_size),
                        ""
                    ])

                first_field_ptr = None
                copy_size = 0

                if field["is_dynamic"]:
                    # Insert dynamic field size
                    dyn_size = get_dyn_field_size(field)

                    for i in range(DYN_FIELD_LEN_SIZE):
                        shift_str = "((%s >> (%dU*8U)) & 0xFFU)" % (dyn_size, i)
                        self.append("ptr[%d] = %s;" % (i, shift_str))
                    self.append("ptr += %i;" % DYN_FIELD_LEN_SIZE)

                    dynamic_field_id += 1

            if typeinfo["plain"]:
                if field["is_dynamic"]:
                    dyn_ptr, dyn_size = get_dyn_field_vars(field)
                    mem_size = dyn_size + "*" + str(typeinfo["static_size"])
                    self.extend([
                        memcpy("ptr", dyn_ptr, mem_size),
                        set_inc_var("ptr", mem_size),
                        ""
                    ])
                else:
                    if first_field_ptr is None:
                        first_field_ptr = "&" + field["name"]

                    num = 1
                    if field["is_array"]:
                        num = field["num"]

                    copy_size += typeinfo["static_size"] * num
            else:
                if not field["is_array"]:
                    serialize_call = "%s.serialize_msg(%s);" % (field["name"], "ptr")
                    self.extend([set_inc_var("ptr", serialize_call), ""])
                else:
                    if field["is_dynamic"]:
                        items_ptr = get_dyn_field_ptr(field)
                        cycle_limit = get_dyn_field_size(field)
                    else:
                        items_ptr = field["name"]
                        cycle_limit = field["num"]

                    serialize_call = "%s[i].serialize_msg(%s);" % (items_ptr, "ptr")

                    self.start_for_cycle(cycle_limit),
                    self.append(set_inc_var("ptr", serialize_call)),
                    self.stop_cycle()
                    self.append("")

        if copy_size != 0:
            self.extend([
                memcpy("ptr", first_field_ptr, copy_size),
                set_inc_var("ptr", copy_size),
                ""
            ])

        self.append("return ptr - %s;" % INPUT_BUF_NAME)
        self.stop_block()

        return list(self._code)

    def generate_parse_method(self, message):
        self.start_block("size_t parse_msg(const uint8_t *%s, uint16_t len, messgen::MemoryAllocator & %s)" %
                         (INPUT_BUF_NAME, INPUT_ALLOC_NAME))

        if message["dynamic_fields_cnt"] == 0:
            self.append(ignore_variable(INPUT_ALLOC_NAME))

        self.extend([
            "const uint8_t * ptr = %s;" % INPUT_BUF_NAME,
            "size_t dyn_parsed_len;",
            "(void)dyn_parsed_len;"
            ""
        ])

        first_field_ptr = None
        copy_size = 0

        dyn_field_id = 0
        dyn_ptr_var = None
        dyn_size_var = None

        for field in message["fields"]:
            typeinfo = self._data_types_map[field["type"]]

            if field["is_dynamic"] or not typeinfo["plain"]:
                if copy_size != 0:
                    self.extend([
                        "if (len < %d) {return 0;}" % copy_size,
                        memcpy(first_field_ptr, "ptr", copy_size),
                        set_inc_var("ptr", copy_size),
                        set_dec_var("len", copy_size),
                        ""
                    ])

                    first_field_ptr = None
                    copy_size = 0

                if field["is_dynamic"]:
                    dyn_field_items_num = get_dynamic_field_items_num()
                    dyn_ptr_var, dyn_size_var = get_dyn_field_vars(field)

                    self.extend([
                        "if (len < %d) {return 0;}" % DYN_FIELD_LEN_SIZE,
                        set_var(dyn_size_var, dyn_field_items_num),
                        set_inc_var("ptr", DYN_FIELD_LEN_SIZE),
                        set_dec_var("len", DYN_FIELD_LEN_SIZE),
                        *allocate_memory(dyn_ptr_var, to_cpp_type(field["type"]), dyn_size_var)
                    ])

                    dyn_field_id += 1

            if typeinfo["plain"]:
                if field["is_dynamic"]:
                    mem_size = dyn_size_var + " * " + str(typeinfo["static_size"])
                    self.extend([
                        "if (len < %s) {return 0;}" % mem_size,
                        memcpy(dyn_ptr_var, "ptr", mem_size),
                        set_inc_var("ptr", mem_size),
                        set_dec_var("len", mem_size),
                        ""
                    ])
                else:
                    if first_field_ptr is None:
                        first_field_ptr = "&" + field["name"]

                    num = 1
                    if field["is_array"]:
                        num = field["num"]

                    copy_size += typeinfo["static_size"] * num
            else:
                if not field["is_array"]:
                    parse_call = "%s.parse_msg(%s, len, %s)" % (field["name"], "ptr", INPUT_ALLOC_NAME)
                    self.extend([
                        set_var("dyn_parsed_len", parse_call),
                        "if (dyn_parsed_len == 0) {return 0;}",
                        set_inc_var("ptr", "dyn_parsed_len"),
                        set_dec_var("len", "dyn_parsed_len"),
                        ""
                    ])
                else:
                    if field["is_dynamic"]:
                        items_ptr = dyn_ptr_var
                        cycle_limit = dyn_size_var
                    else:
                        items_ptr = field["name"]
                        cycle_limit = field["num"]

                    parse_call = "%s[i].parse_msg(%s, len, %s)" % (items_ptr, "ptr", INPUT_ALLOC_NAME)

                    self.start_for_cycle(cycle_limit)
                    self.extend([
                        set_var("dyn_parsed_len", parse_call),
                        "if (dyn_parsed_len == 0) {return 0;}",
                        set_inc_var("ptr", "dyn_parsed_len"),
                        set_dec_var("len", "dyn_parsed_len")
                    ])
                    self.stop_cycle()
                    self.append("")

        if copy_size != 0:
            self.extend([
                "if (len < %d) {return 0;}" % copy_size,
                memcpy(first_field_ptr, "ptr", copy_size),
                set_inc_var("ptr", copy_size),
                set_dec_var("len", copy_size),
                ""
            ])

        self.append("return ptr - %s;" % INPUT_BUF_NAME)
        self.stop_block()

        return list(self._code)

    def generate_data_fields(self, fields):
        for field in fields:
            c_type = to_cpp_type(field["type"])
            if field["is_dynamic"]:
                var = make_variable(field["name"], "messgen::Dynamic<" + c_type + ">", field["num"])
            else:
                var = make_variable(field["name"], c_type, field["num"])

            self.append(var)

    def generate_metadata(self, message_obj):
        msg_cpp_typename = to_cpp_type(message_obj["typename"])

        nested_structs_metadata = "{"
        fields_description = "\""

        for field in message_obj["fields"]:
            typeinfo = self._data_types_map[field["type"]]
            if not typeinfo["plain"]:
                nested_structs_metadata += "&" + to_cpp_type(field["type"]) + "::METADATA, "

            fields_description += to_cpp_type_short(field["type"])

            if field["is_array"]:
                if field["is_dynamic"]:
                    fields_description += "[]"
                else:
                    fields_description += "[%d]" % field["num"]

            fields_description += " " + field["name"] + ";"

        fields_description += "\""
        nested_structs_metadata += "nullptr}"

        self.append("static const messgen::Metadata *nested_msgs[] = %s;" % nested_structs_metadata);
        self.start_block("const messgen::Metadata %s::METADATA = " % message_obj["name"])
        self.extend([
            "\"%s\"," % message_obj["name"],
            fields_description + ",",
            "nested_msgs"
        ])
        self.stop_block(term=";")

        return list(self._code)

    def append(self, v):
        self._code.append(self._indent + v)

    def extend(self, v):
        for l in v:
            self._code.append(self._indent + l)

    def reset(self):
        self._code = []
        self._indent_cnt = 0
        self._indent = ""

    def start_block(self, decl):
        self._code.append(self._indent + decl + " {")
        self._indent_cnt += 1
        self._indent = INDENT * self._indent_cnt

    def stop_block(self, term=""):
        self._indent_cnt -= 1
        self._indent = INDENT * self._indent_cnt
        self._code.append(self._indent + "}" + term)

    def start_for_cycle(self, cycle_limit):
        self.start_block("for (size_t i = 0; i < %s; ++i)" % cycle_limit)

    def stop_cycle(self):
        self.stop_block()
