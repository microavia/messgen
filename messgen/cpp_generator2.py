from . import common
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


class FieldsGroup:
    fields: list[dict]
    field_names: list[str]
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
    _includes = set()
    _ctx = {}
    _aligned_fields = []
    _aligned_size = 0

    def __init__(self, protos):
        self._protocols = protos

    def generate(self, out_dir, proto_name, proto):
        self._ctx["proto_name"] = proto_name
        proto_out_dir = out_dir + os.path.sep + proto_name.replace(common.SEPARATOR, os.path.sep)

        try:
            os.makedirs(proto_out_dir)
        except:
            pass

        namespace = proto_name.replace(common.SEPARATOR, "::")

        for type_name, type_def in proto["types"].items():
            fn = os.path.join(proto_out_dir, type_name) + self._EXT_HEADER
            self._write_code_file(fn, self._generate_type_file(namespace, type_name, type_def))

    def _write_code_file(self, fn, code):
        with open(fn, "w+") as f:
            for line in code:
                f.write(line + os.linesep)

    def _reset_file(self):
        self._includes.clear()

    def _generate_type_file(self, namespace, type_name, type_def) -> list[str]:
        print("Generate type: %s" % type_name)

        self._reset_file()
        code = []

        code.append("namespace %s {" % namespace)
        code.append("")

        if type_def["type_class"] == "enum":
            code.extend(self._generate_type_enum(type_name, type_def))
        elif type_def["type_class"] == "struct":
            code.extend(self._generate_type_struct(type_name, type_def))

        code.append("")
        code.append("} // namespace %s" % namespace)

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_comment_type(self, type_def):
        code = []
        code.append("/**")
        code.append(" * %s" % type_def["comment"])
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type_def):
        code = []

        code.extend(self._generate_comment_type(type_def))
        code.append("enum class %s : %s {" % (type_name, self._cpp_field_def(type_def["base_type"])))
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
            a_sz = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], common.SIZE_TYPE))
            a_el = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["element_type"]))
            return max(a_sz, a_el)
        elif type_class == "map":
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], common.SIZE_TYPE))
            a_key = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["key_type"]))
            a_value = self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], type_def["value_type"]))
            return max(a_sz, a_key, a_value)
        elif type_class == "string":
            # Alignment of string is equal size field alignment
            return self._get_alignment(self._protocols.get_type(self._ctx["proto_name"], common.SIZE_TYPE))
        else:
            raise RuntimeError("Unsupported type_class in _get_alignment: %s" % type_class)

    def _check_alignment(self, type_def, offs):
        align = self._get_alignment(type_def)
        return offs % align == 0

    def _generate_type_struct(self, type_name, type_def):
        curr_proto_name = self._ctx["proto_name"]
        type_def = self._protocols.get_type(curr_proto_name, type_name)

        fields = type_def["fields"]

        self._add_include("cstddef")
        self._add_include("cstring")

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append("struct %s {" % type_name)
        for field in type_def["fields"]:
            field_c_type = self._cpp_field_def(field["type"])
            field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
            align = self._get_alignment(field_type_def)
            code.append("    %s %s;%s" % (
                field_c_type, field["name"], _inline_comment("align=%d " % align + field.get("comment", ""))))

        # Serialize function body
        code_ser = []

        code_ser.extend([
            "size_t _size = 0;",
            "size_t _field_size;",
            "",
        ])

        groups = self._field_groups(fields)
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

        for field in fields:
            field_name = field["name"]
            field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
            code_deser.extend(self._deserialize_field(field_name, field_type_def))
        code_deser.extend(self._deserialize_flush_aligned())
        code_deser.append("return _size;")

        code_deser = ["",
                      "size_t deserialize(const uint8_t *_buf) {",
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

        code.append("};")

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

    def _add_include(self, inc, scope="global"):
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

    def _cpp_namespace(self, proto_name: str) -> str:
        return proto_name.replace(common.SEPARATOR, "::")

    def _cpp_field_def(self, type_name: str) -> str:
        t = self._protocols.get_type(self._ctx["proto_name"], type_name)
        if t["type_class"] == "scalar":
            self._add_include("cstdint")
            return self._CPP_TYPES_MAP[type_name]
        elif t["type_class"] == "array":
            self._add_include("array")
            el_type_name = t["element_type"]
            el_c_type = self._cpp_field_def(el_type_name)
            return "std::array<%s, %d>" % (el_c_type, t["array_size"])
        elif t["type_class"] == "vector":
            self._add_include("vector")
            el_type_name = t["element_type"]
            el_c_type = self._cpp_field_def(el_type_name)
            return "std::vector<%s>" % el_c_type
        elif t["type_class"] == "map":
            self._add_include("map")
            key_c_type = self._cpp_field_def(t["key_type"])
            value_c_type = self._cpp_field_def(t["value_type"])
            return "std::map<%s, %s>" % (key_c_type, value_c_type)
        elif t["type_class"] == "string":
            self._add_include("string")
            return "std::string"
        elif t["type_class"] in ["enum", "struct"]:
            self._add_include("%s.h" % type_name, "local")
            return type_name
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
            if (not (
                    (size is not None)
                    and (groups[-1].size is not None)
                    and (groups[-1].size % align == 0)
                    and (size % align == 0))):  # TODO check?
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
            c_type = self._cpp_field_def(field_type_def["type"])
            size = field_type_def.get("size")
            c.append("*reinterpret_cast<%s *>(&_buf[_size]) = %s;" % (c_type, field_name))
            c.append("_size += %s;" % size)

        elif type_class == "struct":
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)

        elif type_class in ["array", "vector"]:
            if type_class == "vector":
                c.append("*reinterpret_cast<size_type *>(&_buf[_size]) = %s.size();" % field_name)
                c.append("_size += sizeof(size_type);")
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
            c.append("*reinterpret_cast<size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(size_type);")
            key_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["key_type"])
            value_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["value_type"])
            c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
            c.extend(
                _indent(self._serialize_field("_i%d.first" % level_n, key_type_def, level_n + 1)))
            c.extend(_indent(
                self._serialize_field("_i%d.second" % level_n, value_type_def, level_n + 1)))
            c.append("}")

        elif type_class == "string":
            c.append("*reinterpret_cast<size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(size_type);")
            c.append("%s.copy(reinterpret_cast<char *>(&_buf[_size]), %s.size());" % (field_name, field_name))
            c.append("_size += %s.size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialize_field: %s" % type_class)

        return c

    def _serialize_flush_aligned(self):
        c = []
        if self._aligned_size != 0:
            c.append("// %s" % ", ".join(self._aligned_fields))
            c.extend(self._memcpy_to_buf(self._aligned_fields[0], self._aligned_size))
            c.append("")
            self._aligned_fields.clear()
            self._aligned_size = 0
        return c

    def _deserialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def["type_class"]

        c.append("// %s" % field_name)
        if type_class in ["scalar", "enum"]:
            c_type = self._cpp_field_def(field_type_def["type"])
            size = field_type_def.get("size")
            c.append("%s = *reinterpret_cast<const %s *>(&_buf[_size]);" % (field_name, c_type))
            c.append("_size += %s;" % size)

        elif type_class == "struct":
            c.append("_size += %s.deserialize(&_buf[_size]);" % field_name)

        elif type_class in ["array", "vector"]:
            if field_type_def["type_class"] == "vector":
                c.append("%s.resize(*reinterpret_cast<const size_type *>(&_buf[_size]));" % field_name)
                c.append("_size += sizeof(size_type);")
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

        elif type_class == "map":
            c.append("{")
            c.append(_indent("size_t _map_size%d = *reinterpret_cast<const size_type *>(&_buf[_size]);" % level_n))
            c.append(_indent("_size += sizeof(size_type);"))
            key_c_type = self._cpp_field_def(field_type_def["key_type"])
            key_type_def = self._protocols.get_type(self._ctx["proto_name"], field_type_def["key_type"])
            value_c_type = self._cpp_field_def(field_type_def["value_type"])
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
            c.append("_field_size = *reinterpret_cast<const size_type *>(&_buf[_size]);")
            c.append("_size += sizeof(size_type);")
            c.append("%s.assign(reinterpret_cast<const char *>(&_buf[_size]), _field_size);" % field_name)
            c.append("_size += _field_size;")
        else:
            raise RuntimeError("Unsupported type_class in _deserialize_field: %s" % type_class)

        c.append("")

        return c

    def _deserialize_flush_aligned(self):
        c = []
        if self._aligned_size != 0:
            c.append("// %s" % ", ".join(self._aligned_fields))
            c.extend(self._memcpy_from_buf(self._aligned_fields[0], self._aligned_size))
            c.append("")
            self._aligned_fields.clear()
            self._aligned_size = 0
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
                c.append("_size += sizeof(size_type);")
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
            c.append("_size += sizeof(size_type);")
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
            c.append("_size += sizeof(size_type);")
            c.append("_size += %s.size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialized_size_field: %s" % field_type_def["type_class"])

        return c

    def _memcpy_to_buf(self, src: str, size) -> list[str]:
        return [
            "::memcpy(&_buf[_size], reinterpret_cast<const uint8_t *>(&%s), %s);" % (src, size),
            "_size += %s;" % size
        ]

    def _memcpy_from_buf(self, dst: str, size) -> list[str]:
        return [
            "::memcpy(reinterpret_cast<uint8_t *>(&%s), &_buf[_size], %s);" % (dst, size),
            "_size += %s;" % size
        ]
