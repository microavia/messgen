from . import common
from .protocols import Protocols
from . import protocol_version
import os


def inline_comment(comment):
    if comment:
        return "  ///< %s" % comment
    else:
        return ""


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

    def _generate_comment_type(self, type_name, type_def):
        code = []
        code.append("/**")
        code.append(" * %s" % type_def["comment"])
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type_def):
        code = []

        code.extend(self._generate_comment_type(type_name, type_def))
        code.append("enum class %s : %s {" % (type_name, self._cpp_field_def(type_def["base_type"], "")[0]))
        for item in type_def["values"]:
            code.append("    %s = %s,%s" % (item["name"], item["value"], inline_comment(item.get("comment"))))
        code.append("};")

        return code

    def _generate_type_struct(self, type_name, type_def):
        curr_proto_name = self._ctx["proto_name"]
        code = []

        code.extend(self._generate_comment_type(type_name, type_def))
        code.append("struct %s {" % type_name)
        for item in type_def["fields"]:
            field_def = self._cpp_field_def(item["type"], item["name"])
            code.append("    %s %s;%s" % (field_def[0], field_def[1], inline_comment(item.get("comment"))))

        code.append("")
        self._add_include("cstddef")
        code.append("    size_t serialize(uint8_t *buf) const {")

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
                fixed_size = False
                break

        # Copy fixed size part
        if sz != 0:
            self._add_include("cstring")
            code.append("        memcpy(buf, reinterpret_cast<const uint8_t *>(this), %d);" % (sz))

        # Struct is not fixed size, copy remaining variable size fields
        while len(fields) > 0:
            field = fields[0]
            field_type = self._protocols.get_type(curr_proto_name, field["type"])
            if field_type.get("size") is not None:
                raise RuntimeError("Fixed size field after var size field: %s.%s" % (type_name, field["name"]))
            code.append("        %s.serialize(buf);" % field["name"])
            fields = fields[1:]

        code.append("    }")
        code.append("};")

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

    def _cpp_field_def(self, type_name: str, field_name: str) -> tuple[str, str]:
        t = self._protocols.get_type(self._ctx["proto_name"], type_name)
        if t["type_class"] == "scalar":
            self._add_include("cstdint")
            return self._CPP_TYPES_MAP[type_name], field_name
        elif t["type_class"] == "array":
            base_type_name = t["base_type"]
            bf = self._cpp_field_def(base_type_name, field_name)   # To add required includes
            return "%s" % bf[0], "%s[%d]" % (bf[1], t["array_size"])
        elif t["type_class"] == "vector":
            self._add_include("span")
            base_type_name = t["base_type"]
            bf = self._cpp_field_def(base_type_name, field_name)   # To add required includes
            return "std::span<%s>" % bf[0], bf[1]
        elif t["type_class"] in ["enum", "struct"]:
            self._add_include("%s.h" % type_name, "local")
            return type_name, field_name
        else:
            raise RuntimeError("Can't get c++ type for %s" % type_name)
