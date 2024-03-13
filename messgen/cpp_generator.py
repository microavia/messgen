from .common import SEPARATOR, SIZE_TYPE
from .protocols import Protocols
import os


def _inline_comment(comment):
    if comment:
        return "  ///< %s" % comment
    else:
        return ""


def _indent(c):
    spaces = "    "
    if type(c) is str:
        return spaces + c
    elif type(c) is list:
        r = []
        for i in c:
            r.append(spaces + i)
        return r
    else:
        raise RuntimeError("Unsupported type for indent: %s" % type(c))


def _cpp_namespace(proto_name: str) -> str:
    return proto_name.replace(SEPARATOR, "::")


class FieldsGroup:
    fields: list
    field_names: list
    size: int

    def __init__(self):
        self.fields = []
        self.field_names = []
        self.size = 0

    def __repr__(self):
        return str(self)

    def __str__(self):
        return "<FieldsGroup size=%s fields=%s>" % (self.size, self.field_names)


class CppGenerator:
    _PREAMBLE_HEADER = ["#pragma once", ""]
    _EXT_HEADER = ".h"
    _CPP_TYPES_MAP = {
        "bool": "bool",
        "uint8": "uint8_t",
        "int8": "int8_t",
        "uint16": "uint16_t",
        "int16": "int16_t",
        "uint32": "uint32_t",
        "int32": "int32_t",
        "uint64": "uint64_t",
        "int64": "int64_t",
        "float32": "float",
        "float64": "double",
    }

    _protocols: Protocols
    _options: dict
    _includes: set
    _ctx: dict

    def __init__(self, protos, options):
        self._protocols = protos
        self._options = options
        self._includes = set()
        self._ctx = {}

    def generate(self, out_dir, proto_name, proto):
        self._ctx["proto_name"] = proto_name
        proto_out_dir = out_dir + os.path.sep + proto_name.replace(SEPARATOR, os.path.sep)

        try:
            os.makedirs(proto_out_dir)
        except:
            pass

        for type_name, type_def in proto["types"].items():
            fn = os.path.join(proto_out_dir, type_name) + self._EXT_HEADER
            self._write_code_file(fn, self._generate_type_file(type_name, type_def))

        proto_fn = proto_out_dir + self._EXT_HEADER
        self._write_code_file(proto_fn, self._generate_proto_file(proto_name))

    def _get_mode(self):
        return self._options.get("mode", "stl")

    def _get_cpp_standard(self):
        return int(self._options.get("cpp_standard", "11"))

    def _write_code_file(self, fn, code):
        with open(fn, "w+") as f:
            for line in code:
                f.write(line + os.linesep)

    def _reset_file(self):
        self._includes.clear()

    def _generate_type_file(self, type_name, type_def) -> list:
        proto_name = self._ctx["proto_name"]
        print("Generate type: %s/%s" % (proto_name, type_name))

        namespace = _cpp_namespace(proto_name)

        self._reset_file()
        code = []

        code.append("namespace %s {" % namespace)
        code.append("")

        if type_def["type_class"] == "enum":
            code.extend(self._generate_type_enum(type_name, type_def))
        elif type_def["type_class"] == "struct":
            code.extend(self._generate_type_struct(type_name))
        elif type_def["type_class"] == "external":
            code.extend(self._generate_type_external(type_name))

        code.append("")
        code.append("} // namespace %s" % namespace)

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_proto_file(self, proto_name):
        print("Generate protocol file: %s" % proto_name)

        namespace = _cpp_namespace(proto_name)

        self._reset_file()
        code = []

        self._add_include("cstdint")
        self._add_include("messgen/messgen.h")

        code.append("namespace %s {" % namespace)
        code.append("")

        proto = self._protocols.proto_map[proto_name]

        proto_id = proto["proto_id"]
        if proto_id is not None:
            code.append("static constexpr int PROTO_ID = %s;" % proto_id)

        for type_name in proto.get("types"):
            type_def = self._protocols.get_type(proto_name, type_name)
            type_id = type_def.get("id")
            if type_id is not None:
                self._add_include(proto_name + SEPARATOR + type_name + self._EXT_HEADER)

        code.append("")
        code.append("} // namespace %s" % namespace)

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_comment_type(self, type_def):
        if "comment" not in type_def:
            return []
        code = []
        code.append("/**")
        code.append(" * %s" % type_def["comment"])
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type_def):
        code = []

        code.extend(self._generate_comment_type(type_def))
        code.append("enum class %s : %s {" % (type_name, self._cpp_type(type_def["base_type"])))
        for item in type_def["values"]:
            code.append("    %s = %s,%s" % (item["name"], item["value"], _inline_comment(item.get("comment"))))
        code.append("};")

        return code

    def _get_alignment(self, type_def):
        type_class = type_def["type_class"]
        if type_class in ["scalar", "enum"]:
            return type_def["size"]
        elif type_class == "struct":
            # Alignment of struct is equal to max of the field alignments
            a_max = 0
            for field in type_def["fields"]:
                field_type_def = self._protocols.get_type(self._ctx["proto_name"], field["type"])
                a = self._get_alignment(field_type_def)
                if a > a_max:
                    a_max = a
            return a_max
        elif type_class == "array":
            # Alignment of array is equal to alignment of element
            el_type_def = self._protocols.get_type(self._ctx["proto_name"], type_def["element_type"])
            return self._get_alignment(el_type_def)
        elif type_class == "vector":
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], SIZE_TYPE))
            a_el = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["element_type"]))
            return max(a_sz, a_el)
        elif type_class == "map":
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], SIZE_TYPE))
            a_key = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["key_type"]))
            a_value = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["value_type"]))
            return max(a_sz, a_key, a_value)
        elif type_class == "string":
            # Alignment of string is equal size field alignment
            return self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], SIZE_TYPE))
        elif type_class == "external":
            return type_def.get("alignment")
        else:
            raise RuntimeError("Unsupported type_class in _get_alignment: %s" % type_class)

    def _check_alignment(self, type_def, offs):
        align = self._get_alignment(type_def)
        return offs % align == 0

    def _generate_type_external(self, type_name):
        curr_proto_name = self._ctx["proto_name"]
        type_def = self._protocols.get_type(curr_proto_name, type_name)

        self._add_include("cstddef")
        self._add_include("cstring")
        self._add_include("messgen/messgen.h")
        self._add_include(type_def["include"])

        code = []
        code.extend(self._generate_comment_type(type_def))

    def _generate_type_struct(self, type_name):
        curr_proto_name = self._ctx["proto_name"]
        type_def = self._protocols.get_type(curr_proto_name, type_name)

        fields = type_def["fields"]

        self._add_include("cstddef")
        self._add_include("cstring")
        self._add_include("messgen/messgen.h")

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append("struct %s {" % type_name)

        # Type ID, Proto ID
        type_id = type_def.get("id")
        if type_id is not None:
            proto_id = self._protocols.proto_map[curr_proto_name]["proto_id"]
            code.append("    static constexpr int TYPE_ID = %s;" % type_id)
            code.append("    static constexpr int PROTO_ID = %s;" % proto_id)

        groups = self._field_groups(fields)

        # IS_FLAT flag
        is_flat_str = "false"
        if (len(groups) == 1 and groups[0].size is not None):
            code.append(_indent("static constexpr size_t FLAT_SIZE = %d;" % groups[0].size))
            is_flat_str = "true"
        code.append(_indent("static constexpr bool IS_FLAT = %s;" % is_flat_str))
        code.append("")

        for field in type_def["fields"]:
            field_c_type = self._cpp_type(field["type"])
            code.append("    %s %s;%s" % (
                field_c_type, field["name"], _inline_comment(field.get("comment", ""))))

        # Serialize function
        code_ser = []

        code_ser.extend([
            "size_t _size = 0;",
            "size_t _field_size;",
            "",
        ])

        for group in groups:
            if len(group.fields) > 1:
                # There is padding before current field
                # Write together previous aligned fields, if any
                code_ser.append("// %s" % ", ".join(group.field_names))
                code_ser.extend(self._memcpy_to_buf(group.fields[0]["name"], group.size))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_name = field["name"]
                field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
                code_ser.extend(self._serialize_field(field_name, field_type_def))
            else:
                raise RuntimeError("Empty group in struct %s" % type_name)
            code_ser.append("")
        code_ser.append("return _size;")

        code_ser = ["",
                    "size_t serialize(uint8_t *_buf) const {",
                    ] + _indent(code_ser) + [
                       "}"]
        code.extend(_indent(code_ser))

        # Deserialize function
        code_deser = []

        code_deser.extend([
            "size_t _size = 0;",
            "size_t _field_size;",
            "",
        ])

        groups = self._field_groups(fields)
        for group in groups:
            if len(group.fields) > 1:
                # There is padding before current field
                # Write together previous aligned fields, if any
                code_deser.append("// %s" % ", ".join(group.field_names))
                code_deser.extend(self._memcpy_from_buf(group.fields[0]["name"], group.size))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_name = field["name"]
                field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
                code_deser.extend(self._deserialize_field(field_name, field_type_def))
            else:
                raise RuntimeError("Empty group in struct %s" % type_name)
            code_deser.append("")
        code_deser.append("return _size;")

        alloc = ""
        if self._get_mode() == "nostl":
            alloc = ", messgen::Allocator &_alloc"
        code_deser = ["",
                      "size_t deserialize(const uint8_t *_buf%s) {" % alloc,
                      ] + _indent(code_deser) + [
                         "}"]
        code.extend(_indent(code_deser))

        # Size function
        code_ss = []

        fixed_size = 0
        fixed_fields = []
        for field in fields:
            field_name = field["name"]
            field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
            field_size = field_type_def.get("size")

            if field_size is None:
                code_ss.extend(self._serialized_size_field(field_name, field_type_def))
                code_ss.append("")
            else:
                fixed_fields.append(field_name)
                fixed_size += field_size

        code_ss.append("return _size;")

        code_ss = ["",
                   "size_t serialized_size() const {",
                   _indent("// %s" % ", ".join(fixed_fields)),
                   _indent("size_t _size = %d;" % fixed_size),
                   _indent(""),
                   ] + _indent(code_ss) + [
                      "}"]
        code.extend(_indent(code_ss))

        if self._get_cpp_standard() >= 20:
            # Operator <=>
            code.append("")
            code.append(_indent("auto operator<=>(const %s&) const = default;" % type_name))

        code.append("};")

        if self._get_cpp_standard() < 20:
            # Operator ==
            code_eq = []
            field_name = fields[0]["name"]
            code_eq.append("return l.%s == r.%s" % (field_name, field_name))
            for field in fields[1:]:
                field_name = field["name"]
                code_eq.append("   and l.%s == r.%s" % (field_name, field_name))
            code_eq[-1] += ";"

            code.extend([
                            "",
                            "bool operator==(const %s& l, const %s& r) {" % (type_name, type_name),
                        ] + _indent(code_eq) + [
                            "}"
                        ])

        return code

    def _add_include(self, inc: str, scope="global"):
        self._includes.add((inc, scope))

    def _generate_includes(self):
        code = []
        for inc in list(self._includes):
            if inc[1] == "local":
                code.append("#include \"%s\"" % inc[0])
            else:
                code.append("#include <%s>" % inc[0])
        if len(code) > 0:
            code.append("")
        return code

    def _cpp_type(self, type_name: str) -> str:
        t = self._protocols.get_type(self._ctx["proto_name"], type_name)
        mode = self._get_mode()
        if t["type_class"] == "scalar":
            self._add_include("cstdint")
            return self._CPP_TYPES_MAP[type_name]
        elif t["type_class"] == "array":
            self._add_include("array")
            el_type_name = _cpp_namespace(t["element_type"])
            el_c_type = self._cpp_type(el_type_name)
            return "std::array<%s, %d>" % (el_c_type, t["array_size"])
        elif t["type_class"] == "vector":
            el_type_name = t["element_type"]
            el_c_type = self._cpp_type(el_type_name)
            if mode == "stl":
                self._add_include("vector")
                return "std::vector<%s>" % el_c_type
            elif mode == "nostl":
                return "messgen::vector<%s>" % el_c_type
            else:
                raise RuntimeError("Unsupported mode for vector: %s" % mode)
        elif t["type_class"] == "map":
            key_c_type = self._cpp_type(t["key_type"])
            value_c_type = self._cpp_type(t["value_type"])
            if mode == "stl":
                self._add_include("map")
                return "std::map<%s, %s>" % (key_c_type, value_c_type)
            elif mode == "nostl":
                self._add_include("span")
                return "std::span<std::pair<%s, %s>>" % (key_c_type, value_c_type)
            else:
                raise RuntimeError("Unsupported mode for map: %s" % mode)
        elif t["type_class"] == "string":
            if mode == "stl":
                self._add_include("string")
                return "std::string"
            elif mode == "nostl":
                self._add_include("string_view")
                return "std::string_view"
            else:
                raise RuntimeError("Unsupported mode for string: %s" % mode)
        elif t["type_class"] in ["enum", "struct"]:
            if SEPARATOR in type_name:
                scope = "global"
            else:
                scope = "local"
            self._add_include("%s.h" % type_name, scope)
            return _cpp_namespace(type_name)
        elif t["type_class"] == "external":
            return t["class"]
        else:
            raise RuntimeError("Can't get c++ type for %s" % type_name)

    def _field_groups(self, fields):
        groups = [FieldsGroup()]
        for field in fields:
            type_def = self._protocols.get_type(self._ctx["proto_name"], field["type"])
            type_class = type_def["type_class"]
            align = self._get_alignment(type_def)
            size = type_def.get("size")
            # Check if there is padding before this field
            if len(groups[-1].fields) > 0 and (
                    (size is None) or
                    (groups[-1].size is None) or
                    (groups[-1].size % align != 0) or
                    (size % align != 0)):
                # Start next group
                groups.append(FieldsGroup())

            groups[-1].fields.append(field)
            groups[-1].field_names.append(field["name"])
            if groups[-1].size is not None:
                if size is not None:
                    groups[-1].size += size
                else:
                    groups[-1].size = None
        return groups

    def _serialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def["type_class"]

        c.append("// %s" % field_name)
        if type_class in ["scalar", "enum"]:
            c_type = self._cpp_type(field_type_def["type"])
            size = field_type_def.get("size")
            c.append("*reinterpret_cast<%s *>(&_buf[_size]) = %s;" % (c_type, field_name))
            c.append("_size += %s;" % size)

        elif type_class == "struct":
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)

        elif type_class in ["array", "vector"]:
            if type_class == "vector":
                c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
                c.append("_size += sizeof(messgen::size_type);")
            el_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
            el_size = el_type_def.get("size")
            el_align = self._get_alignment(el_type_def)
            if el_size is not None and el_size % el_align == 0:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                c.extend(self._memcpy_to_buf("%s[0]" % field_name, "_field_size"))
            else:
                # Vector of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                c.append("}")

        elif type_class == "map":
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            key_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["key_type"])
            value_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["value_type"])
            c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
            c.extend(
                _indent(self._serialize_field("_i%d.first" % level_n, key_type_def, level_n + 1)))
            c.extend(_indent(
                self._serialize_field("_i%d.second" % level_n, value_type_def, level_n + 1)))
            c.append("}")

        elif type_class == "string":
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            c.append("%s.copy(reinterpret_cast<char *>(&_buf[_size]), %s.size());" % (field_name, field_name))
            c.append("_size += %s.size();" % field_name)

        elif type_class == "external":
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialize_field: %s" % type_class)

        return c

    def _deserialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def["type_class"]
        mode = self._get_mode()

        c.append("// %s" % field_name)
        if type_class in ["scalar", "enum"]:
            c_type = self._cpp_type(field_type_def["type"])
            size = field_type_def.get("size")
            c.append("%s = *reinterpret_cast<const %s *>(&_buf[_size]);" % (field_name, c_type))
            c.append("_size += %s;" % size)

        elif type_class == "struct":
            alloc = ""
            if mode == "nostl":
                alloc = ", _alloc"
            c.append("_size += %s.deserialize(&_buf[_size]%s);" % (field_name, alloc))

        elif type_class == "array":
            el_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
            el_size = el_type_def.get("size")
            el_align = self._get_alignment(el_type_def)
            if el_size is not None and el_size % el_align == 0:
                # Vector or array of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                c.extend(self._memcpy_from_buf("%s[0]" % field_name, "_field_size"))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                c.append("}")

        elif type_class == "vector":
            if mode == "stl":
                el_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
                el_size = el_type_def.get("size")
                el_align = self._get_alignment(el_type_def)
                c.append("%s.resize(*reinterpret_cast<const messgen::size_type *>(&_buf[_size]));" % field_name)
                c.append("_size += sizeof(messgen::size_type);")
                if el_size is not None and el_size % el_align == 0:
                    # Vector or array of fixed size elements, optimize with single memcpy
                    c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                    c.extend(self._memcpy_from_buf("%s[0]" % field_name, "_field_size"))
                else:
                    # Vector or array of variable size elements
                    c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                    c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                    c.append("}")
            elif mode == "nostl":
                el_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
                el_c_type = self._cpp_type(field_type_def["element_type"])
                el_size = el_type_def.get("size")
                el_align = self._get_alignment(el_type_def)
                c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
                c.append("%s = {_alloc.alloc<%s>(_field_size), _field_size};" % (field_name, el_c_type))
                c.append("_size += sizeof(messgen::size_type);")
                if el_size is not None and el_size % el_align == 0:
                    # Vector or array of fixed size elements, optimize with single memcpy
                    if el_size != 1:
                        c.append("_field_size *= %d;" % el_size)
                    c.extend(self._memcpy_from_buf("%s[0]" % field_name, "_field_size"))
                else:
                    # Vector or array of variable size elements
                    c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                    c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                    c.append("}")

        elif type_class == "map":
            c.append("{")
            c.append(_indent("size_t _map_size%d = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);" % level_n))
            c.append(_indent("_size += sizeof(messgen::size_type);"))
            key_c_type = self._cpp_type(field_type_def["key_type"])
            key_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["key_type"])
            value_c_type = self._cpp_type(field_type_def["value_type"])
            value_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["value_type"])
            c.append(
                _indent(
                    "for (size_t _i%d = 0; _i%d < _map_size%d; ++_i%d) {" % (level_n, level_n, level_n, level_n)))
            c.append(_indent(_indent("%s _key%d;" % (key_c_type, level_n))))
            c.append(_indent(_indent("%s _value%d;" % (value_c_type, level_n))))
            c.append(_indent(_indent("")))
            c.extend(_indent(
                _indent(
                    self._deserialize_field("_key%d" % level_n, key_type_def, level_n + 1))))
            c.extend(_indent(_indent(
                self._deserialize_field("_value%d" % level_n, value_type_def, level_n + 1))))
            c.append(_indent(_indent("%s[_key%d] = _value%d;" % (field_name, level_n, level_n))))
            c.append(_indent("}"))
            c.append("}")

        elif type_class == "string":
            c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
            c.append("_size += sizeof(messgen::size_type);")
            c.append("%s = {reinterpret_cast<const char *>(&_buf[_size]), _field_size};" % field_name)
            c.append("_size += _field_size;")

        elif type_class == "external":
            alloc = ""
            if mode == "nostl":
                alloc = ", _alloc"
            c.append("_size += %s.deserialize(&_buf[_size]%s);" % (field_name, alloc))
        else:
            raise RuntimeError("Unsupported type_class in _deserialize_field: %s" % type_class)

        c.append("")

        return c

    def _serialized_size_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def["type_class"]

        c.append("// %s" % field_name)
        if type_class == "scalar":
            size = field_type_def.get("size")
            c.append("_size += %d;" % size)

        elif type_class == "struct":
            c.append("_size += %s.serialized_size();" % field_name)

        elif type_class in ["array", "vector"]:
            if field_type_def["type_class"] == "vector":
                c.append("_size += sizeof(messgen::size_type);")
            el_type = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
            el_size = el_type.get("size")
            if el_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (el_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d" % level_n, el_type, level_n + 1)))
                c.append("}")

        elif type_class == "map":
            c.append("_size += sizeof(messgen::size_type);")
            key_type = self._protocols.get_type(self._ctx["proto_name"], field_type_def["key_type"])
            value_type = self._protocols.get_type(self._ctx["proto_name"], field_type_def["value_type"])
            key_size = key_type.get("size")
            value_size = value_type.get("size")
            if key_size is not None and value_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (key_size + value_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d.first" % level_n, key_type, level_n + 1)))
                c.extend(_indent(self._serialized_size_field("_i%d.second" % level_n, value_type, level_n + 1)))
                c.append("}")

        elif type_class == "string":
            c.append("_size += sizeof(messgen::size_type);")
            c.append("_size += %s.size();" % field_name)

        elif type_class == "external":
            c.append("_size += %s.get_size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialized_size_field: %s" % field_type_def["type_class"])

        return c

    def _memcpy_to_buf(self, src: str, size) -> list:
        return [
            "::memcpy(&_buf[_size], reinterpret_cast<const uint8_t *>(&%s), %s);" % (src, size),
            "_size += %s;" % size
        ]

    def _memcpy_from_buf(self, dst: str, size) -> list:
        return [
            "::memcpy(reinterpret_cast<uint8_t *>(&%s), &_buf[_size], %s);" % (dst, size),
            "_size += %s;" % size
        ]
