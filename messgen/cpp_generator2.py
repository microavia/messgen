from . import common
from .protocols import Protocols
import os


def inline_comment(comment):
    if comment:
        return "  ///< %s" % comment
    else:
        return ""


def indent(c):
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
        print("Generate type %s:\n%s" % (type_name, type_def))

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
        code.append("enum class %s : %s {" % (type_name, self._cpp_field_def(type_def["base_type"], "")[0]))
        for item in type_def["values"]:
            code.append("    %s = %s,%s" % (item["name"], item["value"], inline_comment(item.get("comment"))))
        code.append("};")

        return code

    def _generate_type_struct(self, type_name, type_def):
        curr_proto_name = self._ctx["proto_name"]
        type_def = self._protocols.get_type(curr_proto_name, type_name)

        # Calculate size of the fixed size part
        fixed_size = 0
        fields = list(type_def["fields"])
        fields_cpy = list(fields)
        while len(fields_cpy) > 0:
            field = fields_cpy[0]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])
            field_size = field_type.get("size")
            if field_size is not None:
                fixed_size += field_size
                fields_cpy = fields_cpy[1:]
            else:
                break
        var_fields = fields_cpy

        self._add_include("cstddef")

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append("struct %s {" % type_name)
        for item in type_def["fields"]:
            field_def = self._cpp_field_def(item["type"], item["name"])
            code.append("    %s %s;%s" % (field_def[0], field_def[1], inline_comment(item.get("comment"))))

        # Serialize function body
        code_ser = []

        # Copy fixed size part
        if fixed_size != 0:
            self._add_include("cstring")
            code_ser.extend([
                "// Fixed size part",
                "::memcpy(_buf, reinterpret_cast<const uint8_t *>(this), %d);" % fixed_size,
            ])

        code_ser.extend([
            "size_t _size = %d;" % fixed_size,
            "size_t _field_size;",
            "",
        ])

        # Struct is not fixed size, copy remaining variable size fields
        if len(var_fields) > 0:
            code_ser.append("// Variable size part")
            for field in var_fields:
                field_name = field["name"]
                field_type = self._protocols.get_type(curr_proto_name, field["type"])

                if field_type.get("size") is not None:
                    raise RuntimeError("Fixed size field after var size field: %s.%s" % (type_name, field["name"]))

                code_ser.extend(self._serialize_field(field_name, field_type))
                code_ser.append("")

        code_ser.append("return _size;")

        code_ser = ["",
                    "size_t serialize(uint8_t *_buf) const {",
                    ] + indent(code_ser) + [
                       "}"]
        code.extend(indent(code_ser))

        # Deserialize function
        code_deser = []

        # Copy fixed size part
        if fixed_size != 0:
            self._add_include("cstring")
            code_deser.extend([
                "// Fixed size part",
                "::memcpy(reinterpret_cast<uint8_t *>(this), _buf, %d);" % fixed_size,
            ])

        code_deser.extend([
            "size_t _size = %d;" % fixed_size,
            "size_t _field_size;",
            "",
        ])

        # Struct is not fixed size, copy remaining variable size fields
        if len(var_fields) > 0:
            code_ser.append("// Variable size part")
            for field in var_fields:
                field_name = field["name"]
                field_type = self._protocols.get_type(curr_proto_name, field["type"])

                if field_type.get("size") is not None:
                    raise RuntimeError(
                        "Fixed size field after variable size field not allowed: %s.%s" % (type_name, field["name"]))

                code_deser.extend(self._deserialize_field(field_name, field_type))
                code_deser.append("")

        code_deser.append("return _size;")

        code_deser = ["",
                      "size_t deserialize(const uint8_t *_buf) {",
                      ] + indent(code_deser) + [
                         "}"]
        code.extend(indent(code_deser))

        # Size function
        code_ss = []

        # Fixed size part size
        code_ss.extend([
            "// Fixed size part",
            "size_t _size = %d;" % fixed_size,
            "",
        ])

        # Struct is not fixed size, calculate remaining variable size fields
        if len(var_fields) > 0:
            code_ss.append("// Variable size part")
            for field in var_fields:
                field_name = field["name"]
                field_type = self._protocols.get_type(curr_proto_name, field["type"])

                if field_type.get("size") is not None:
                    raise RuntimeError("Fixed size field after var size field: %s.%s" % (type_name, field["name"]))

                code_ss.extend(self._serialized_size_field(field_name, field_type))
                code_ss.append("")

        code_ss.append("return _size;")

        code_ss = ["",
                   "size_t serialized_size() const {",
                   ] + indent(code_ss) + [
                      "}"]
        code.extend(indent(code_ss))

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
                    ] + indent(code_eq) + [
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

    def _cpp_field_def(self, type_name: str, field_name: str) -> tuple[str, str]:
        t = self._protocols.get_type(self._ctx["proto_name"], type_name)
        if t["type_class"] == "scalar":
            self._add_include("cstdint")
            return self._CPP_TYPES_MAP[type_name], field_name
        elif t["type_class"] == "array":
            self._add_include("array")
            base_type_name = t["base_type"]
            bf = self._cpp_field_def(base_type_name, field_name)  # To add required includes
            return "std::array<%s, %d>" % (bf[0], t["array_size"]), bf[1]
        elif t["type_class"] == "vector":
            self._add_include("vector")
            base_type_name = t["base_type"]
            bf = self._cpp_field_def(base_type_name, field_name)  # To add required includes
            return "std::vector<%s>" % bf[0], bf[1]
        elif t["type_class"] in ["enum", "struct"]:
            self._add_include("%s.h" % type_name, "local")
            return type_name, field_name
        else:
            raise RuntimeError("Can't get c++ type for %s" % type_name)

    def _serialize_field(self, field_name, field_type, level_n=0):
        c = []
        if field_type["type_class"] == "struct":
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("*reinterpret_cast<size_type *>(&_buf[_size]) = %s.size();" % field_name)
                c.append("_size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (bsz, field_name))
                c.append(
                    "::memcpy(&_buf[_size], reinterpret_cast<const uint8_t *>(%s.begin().base()), _field_size);" % field_name)
                c.append("_size += _field_size;")
            else:
                # Vector of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._serialize_field("_i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c

    def _deserialize_field(self, field_name, field_type, level_n=0):
        c = []
        if field_type["type_class"] == "struct":
            c.append("_size += %s.deserialize(&_buf[_size]);" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("%s.resize(*reinterpret_cast<const size_type *>(&_buf[_size]));" % field_name)
                c.append("_size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (bsz, field_name))
                c.append(
                    "::memcpy(reinterpret_cast<uint8_t *>(%s.begin().base()), &_buf[_size], _field_size);" % field_name)
                c.append("_size += _field_size;")
            else:
                # Vector of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._deserialize_field("_i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c

    def _serialized_size_field(self, field_name, field_type, level_n=0):
        c = []
        if field_type["type_class"] == "struct":
            c.append("_size += %s.serialized_size();" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("_size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("_size += %d * %s.size();" % (bsz, field_name))
            else:
                # Vector of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._serialized_size_field("_i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c
