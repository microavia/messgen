from . import common
from . protocols import Protocols
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

    _protocols : Protocols
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

        for type_name, type in proto["types"].items():
            fn = os.path.join(proto_out_dir, type_name) + self._EXT_HEADER
            self._write_code_file(fn, self._generate_type_file(namespace, type_name, type))

    def _write_code_file(self, fn, code):
        with open(fn, "w+") as f:
            for line in code:
                f.write(line + os.linesep)

    def _reset_file(self):
        self._includes.clear()

    def _generate_type_file(self, namespace, type_name, type) -> list[str]:
        print("Generate type %s:\n%s" % (type_name, type))

        self._reset_file()
        code = []

        code.append("namespace %s {" % namespace)
        code.append("")

        if type["type_class"] == "enum":
            code.extend(self._generate_type_enum(type_name, type))
        elif type["type_class"] == "struct":
            code.extend(self._generate_type_struct(type_name, type))

        code.append("")
        code.append("} // namespace %s" % namespace)

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_comment_type(self, type_name, type):
        code = []
        code.append("/**")
        code.append(" * %s" % type["comment"])
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type):
        code = []

        code.extend(self._generate_comment_type(type_name, type))
        code.append("enum class %s : %s {" % (type_name, self._cpp_type(type["base_type"])))
        for item in type["values"]:
            code.append("    %s = %s,%s" % (item["name"], item["value"], inline_comment(item.get("comment"))))
        code.append("}")

        return code

    def _generate_type_struct(self, type_name, type):
        code = []

        code.extend(self._generate_comment_type(type_name, type))
        code.append("struct %s {" % type_name)
        for item in type["fields"]:
            code.append("    %s %s;%s" % (self._cpp_type(item["type"]), item["name"], inline_comment(item.get("comment"))))

        code.append("")
        code.append("    size_t serialize(uint8_t *buf) const {")
        size = self._protocols.get_type(self._ctx["proto_name"], type_name).get("size")
        if size != None:
            code.append("    memcpy(..., %d)" % size)
        code.append("    }")
        code.append("}")

        return code

    def _add_include(self, inc):
        self._includes.add(inc)

    def _generate_includes(self):
        code = []
        for inc in list(self._includes):
            code.append("#include <%s>" % inc)
        if len(code) > 0:
            code.append("")
        return code

    def _cpp_type(self, t):
        types = self._protocols.proto_map[self._ctx["proto_name"]]["types"]
        if t in self._CPP_TYPES_MAP:
            self._add_include("stdint")
            return self._CPP_TYPES_MAP[t]
        elif t in types:
            self._add_include(t + self._EXT_HEADER)
            return t
        else:
            raise RuntimeError("Can't get c++ type for %s" % t)
