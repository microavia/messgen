from . import common
from .protocols import Protocols
import os


def inline_comment(comment):
    if comment:
        return "  ///< %s" % comment
    else:
        return ""


def indent(c):
    r = []
    for i in c:
        r.append("    " + i)
    return r


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

        code = []

        code.extend(self._generate_comment_type(type_def))
        code.append("struct %s {" % type_name)
        for item in type_def["fields"]:
            field_def = self._cpp_field_def(item["type"], item["name"])
            code.append("    %s %s;%s" % (field_def[0], field_def[1], inline_comment(item.get("comment"))))

        # Serialize function body
        self._add_include("cstddef")
        type_def = self._protocols.get_type(curr_proto_name, type_name)

        code_ser = []

        # Calculate size of the fixed size part
        sz = 0
        fields = list(type_def["fields"])
        while len(fields) > 0:
            field = fields[0]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])
            field_size = field_type.get("size")
            if field_size is not None:
                sz += field_size
                fields = fields[1:]
            else:
                break

        # Copy fixed size part
        if sz != 0:
            self._add_include("cstring")
            code_ser.extend([
                "// Fixed size part",
                "::memcpy(__buf, reinterpret_cast<const uint8_t *>(&v), %d);" % (sz),
            ])

        code_ser.extend([
            "size_t __size = %d;" % sz,
            "size_t __field_size;",
            "",
        ])

        # Struct is not fixed size, copy remaining variable size fields
        if len(fields) > 0:
            code_ser.append("// Variable size part")

        while len(fields) > 0:
            field = fields[0]
            field_name = field["name"]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])

            if field_type.get("size") is not None:
                raise RuntimeError("Fixed size field after var size field: %s.%s" % (type_name, field["name"]))

            code_ser.extend(self._serialize_field("v.%s" % field_name, field_type))
            code_ser.append("")
            fields = fields[1:]

        code_ser.append("return __size;")

        code_ser = ["",
                    "size_t serialize(uint8_t *__buf) {",
                    ] + indent(code_ser) + [
                       "}"]
        code.extend(indent(code_ser))

        # Deserialize function
        code.append("")
        self._add_include("cstddef")
        code.append("    size_t deserialize(%s::%s &v, const uint8_t *buf) {" % (
            self._cpp_namespace(curr_proto_name), type_name))

        type_def = self._protocols.get_type(curr_proto_name, type_name)

        # Calculate size of the fixed size part
        sz = 0
        fields = list(type_def["fields"])
        while len(fields) > 0:
            field = fields[0]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])
            field_size = field_type.get("size")
            if field_size is not None:
                sz += field_size
                fields = fields[1:]
            else:
                break

        # Copy fixed size part
        if sz != 0:
            self._add_include("cstring")
            code.append("    // Fixed size part")
            code.append("    ::memcpy(reinterpret_cast<uint8_t *>(&v), buf, %d);" % (sz))

        code.append("    size_t size = %d;" % sz)
        code.append("    size_t field_size;")
        code.append("")

        # Struct is not fixed size, copy remaining variable size fields
        if len(fields) > 0:
            code.append("    // Variable size part")

        while len(fields) > 0:
            field = fields[0]
            field_name = field["name"]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])

            if field_type.get("size") is not None:
                raise RuntimeError(
                    "Fixed size field after variable size field not allowed: %s.%s" % (type_name, field["name"]))

            code.extend(self._deserialize_field("v.%s" % field_name, field_type))
            code.append("")
            fields = fields[1:]

        code.append("    return size;")
        code.append("}")

        # Size function
        code.append("")
        code.append("    size_t serialized_size(const %s::%s &v) {" % (self._cpp_namespace(curr_proto_name), type_name))

        type_def = self._protocols.get_type(curr_proto_name, type_name)

        # Calculate size of the fixed size part
        sz = 0
        fields = list(type_def["fields"])
        while len(fields) > 0:
            field = fields[0]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])
            field_size = field_type.get("size")
            if field_size is not None:
                sz += field_size
                fields = fields[1:]
            else:
                break

        # Fixed size part size
        code.append("        // Fixed size part")
        code.append("        size_t size = %d;" % sz)
        code.append("")

        # Struct is not fixed size, copy remaining variable size fields
        if len(fields) > 0:
            code.append("        // Variable size part")

        while len(fields) > 0:
            field = fields[0]
            field_name = field["name"]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])

            if field_type.get("size") is not None:
                raise RuntimeError("Fixed size field after var size field: %s.%s" % (type_name, field["name"]))

            code.extend(self._serialized_size_field("v.%s" % field_name, field_type))
            code.append("")
            fields = fields[1:]

        code.append("        return size;")
        code.append("    }")
        code.append("")
        code.append("}")

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
            c.append("__size += %s.serialize(__buf);" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("*reinterpret_cast<size_type *>(&__buf[__size]) = %s.size();" % field_name)
                c.append("__size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("__field_size = %d * %s.size();" % (bsz, field_name))
                c.append(
                    "::memcpy(&__buf[__size], reinterpret_cast<const uint8_t *>(%s.begin().base()), __field_size);" % field_name)
                c.append("__size += __field_size;")
            else:
                # Vector of variable size elements
                c.append("for (auto &__i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._serialize_field("__i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c

    def _deserialize_field(self, field_name, field_type, level_n=0):
        c = []
        if field_type["type_class"] == "struct":
            c.append("size += deserialize(%s, buf);" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("%s.resize(*reinterpret_cast<const size_type *>(&buf[size]));" % field_name)
                c.append("size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("field_size = %d * %s.size();" % (bsz, field_name))
                c.append(
                    "::memcpy(reinterpret_cast<uint8_t *>(%s.begin().base()), &buf[size], field_size);" % field_name)
                c.append("size += field_size;")
            else:
                # Vector of variable size elements
                c.append("for (auto &i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._deserialize_field("i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c

    def _serialized_size_field(self, field_name, field_type, level_n=0):
        c = []
        if field_type["type_class"] == "struct":
            c.append("size += serialized_size(%s);" % field_name)
        elif field_type["type_class"] in ["array", "vector"]:
            if field_type["type_class"] == "vector":
                c.append("size += sizeof(size_type);")
            base_type = self._protocols.get_type(self._ctx["proto_name"], field_type["base_type"])
            bsz = base_type.get("size")
            if bsz is not None:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("size += %d * %s.size();" % (bsz, field_name))
            else:
                # Vector of variable size elements
                c.append("for (auto &i%d: %s) {" % (level_n, field_name))
                c.extend(indent(self._serialized_size_field("i%d" % level_n, base_type, level_n + 1)))
                c.append("}")
        return c
