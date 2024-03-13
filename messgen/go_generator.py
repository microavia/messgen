import os

from .common import SEPARATOR
from .protocols import Protocols


def to_camelcase(str):
    if not any(c in "_" for c in str):
        return str[0].upper() + str[1:]

    return ''.join(x for x in str.title().replace('_', '') if not x.isspace())


def _inline_comment(comment):
    if comment:
        return "  // %s" % comment
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


class GoGenerator:
    _ENUM_SUFFIX = "Enum"
    _PACKAGE = "messages"
    _GO_TYPES_MAP = {}

    def __init__(self, protos: Protocols, options: dict):
        self._protocols: Protocols = protos
        self._options: dict = options
        self._imports: set = set()
        self._ctx: dict = {}

    def generate(self, out_dir, proto_name, proto):
        self._ctx["proto_name"] = proto_name
        proto_out_dir = out_dir + os.path.sep + proto_name.replace(SEPARATOR, os.path.sep)

        try:
            os.makedirs(proto_out_dir)
        except:
            pass

        fn = os.path.join(proto_out_dir, self._PACKAGE + ".go")
        self._write_code_file(fn, self._generate_package(proto_name))

    def _write_code_file(self, fn, code):
        with open(fn, "w+") as f:
            for line in code:
                f.write(line + os.linesep)

    def _reset_file(self):
        self._imports.clear()

    def _generate_package(self, proto_name: str) -> list:
        print("Generate package: %s/%s" % (proto_name, self._PACKAGE))

        proto = self._protocols.proto_map[proto_name]

        self._reset_file()
        code = []

        for type_name, type_def in proto["types"].items():
            if type_def["type_class"] == "enum":
                code.extend(self._generate_type_enum(type_name))
            elif type_def["type_class"] == "struct":
                code.extend(self._generate_type_struct(type_name))

            # self._write_code_file(fn, self._generate_type_file(type_name, type_def))

        # code.extend(self._generate_type_enum(type_name, type_def))

        code = ["package %s" % self._PACKAGE, ""] + self._generate_imports() + code

        return code

    def _add_import(self, imp):
        self._imports.add(imp)

    def _generate_imports(self):
        code = []
        for imp in list(self._imports):
            code.append(_indent('"%s"' % imp))
        if len(code) > 0:
            code = ["import ("] + code + [")", ""]
        return code

    def _go_type(self, type_name: str) -> str:
        t = self._protocols.get_type(self._ctx["proto_name"], type_name)
        if t["type_class"] == "scalar":
            return self._GO_TYPES_MAP.get(type_name, type_name)
        elif t["type_class"] == "array":
            el_go_type = self._go_type(t["element_type"])
            return "[%s]%s" % (t["array_size"], el_go_type)
        elif t["type_class"] == "vector":
            el_go_type = self._go_type(t["element_type"])
            return "[]%s" % el_go_type
        elif t["type_class"] == "map":
            key_go_type = self._go_type(t["key_type"])
            value_go_type = self._go_type(t["value_type"])
            return "map[%s]%s" % (key_go_type, value_go_type)
        elif t["type_class"] in ["struct", "enum"]:
            return to_camelcase(type_name)
        elif t["type_class"] == "string":
            return "string"
        else:
            raise RuntimeError("Can't get Go type for type %s (type class %s)" % (type_name, t["type_class"]))

    def _generate_type_enum(self, type_name: str) -> list:
        self._add_import("fmt")
        type_def = self._protocols.get_type(self._ctx["proto_name"], type_name)
        go_type = to_camelcase(type_name)
        go_base_type = self._go_type(type_def["base_type"])
        code = []
        code.append("type %s %s" % (go_type, go_base_type))
        code.append("")
        code.append("const (")
        for v in type_def["values"]:
            code.append(_indent("%s%s %s = %s%s" % (
                go_type, to_camelcase(v["name"]), go_type, v["value"], _inline_comment(v["comment"]))))
        code.append(")")
        code.append("")

        code_str = []
        code_str.append("switch v {")
        for v in type_def["values"]:
            code_str.append(_indent("case %s%s:" % (go_type, to_camelcase(v["name"]))))
            code_str.append(_indent(_indent("return \"%s\"" % v["name"])))
        code_str.append("}")
        code_str.append("return fmt.Sprintf(\"unknown (%d)\", v)")

        code.append("func (v %s) String() string {" % go_type)
        code.extend(_indent(code_str))
        code.append("}")
        return code

    def _generate_type_struct(self, type_name: str) -> list:
        self._add_import("fmt")
        curr_proto_name = self._ctx["proto_name"]
        type_def = self._protocols.get_type(curr_proto_name, type_name)
        go_type = to_camelcase(type_name)
        code = []
        comment = type_def.get("comment")
        if comment:
            code.append("// %s %s" % (go_type, comment))
        code.append("type %s struct {" % go_type)
        for field in type_def["fields"]:
            field_gp_type = self._go_type(field["type"])
            code.append(_indent(
                "%s %s%s" % (to_camelcase(field["name"]), field_gp_type, _inline_comment(field.get("comment", "")))))
        code.append("}")
        code.append("")

        # Generate GetTypeId method
        type_id = type_def.get("id")
        if type_id is not None:
            code.append("func (v *%s) GetTypeId() uint32 {" % go_type)
            code.append(_indent("return %s" % type_id))
            code.append("}")
            code.append("")

            # Generate GetProtoId method
            proto_id = self._protocols.proto_map[curr_proto_name]["proto_id"]
            code.append("func (v *%s) GetProtoId() uint32 {" % go_type)
            code.append(_indent("return %s" % proto_id))
            code.append("}")
            code.append("")

        # Generate SerializedSize method
        code.append("func (v *%s) SerializedSize() int64 {" % go_type)
        sz = type_def.get("size")
        if sz is not None:
            code.append(_indent("return %d" % sz))
        else:
            code_ss = []
            fixed_size = 0
            fixed_fields = []
            for field in type_def["fields"]:
                field_name = field["name"]
                field_type_def = self._protocols.get_type(curr_proto_name, field["type"])
                field_size = field_type_def.get("size")

                if field_size is None:
                    code_ss.extend(self._serialized_size_field(field_name, field_type_def))
                    code_ss.append("")
                else:
                    fixed_fields.append(field_name)
                    fixed_size += field_size

            code_ss.append("return _size")

            code.append(_indent("// %s" % ", ".join(fixed_fields)))
            code.append(_indent("_size := int64(%d)" % fixed_size))
            code.append(_indent(""))
            code.extend(_indent(code_ss))
        code.append("}")
        code.append("")

        code.append("func (v *%s) Serialize(buf []byte) (int, error) {" % go_type)
        code.append(_indent("return (0, 0)"))
        code.append("}")
        code.append("")
        return code

    def _serialized_size_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def["type_class"]

        c.append("// %s" % field_name)
        if type_class == "scalar":
            size = field_type_def.get("size")
            c.append("_size += %d" % size)

        elif type_class == "struct":
            c.append("_size += %s.serialized_size()" % field_name)

        elif type_class in ["array", "vector"]:
            if field_type_def["type_class"] == "vector":
                c.append("_size += sizeof(messgen::size_type)")
            el_type = self._protocols.get_type(self._ctx["proto_name"], field_type_def["element_type"])
            el_size = el_type.get("size")
            if el_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size()" % (el_size, field_name))
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
                c.append("_size += %d * %s.size()" % (key_size + value_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d.first" % level_n, key_type, level_n + 1)))
                c.extend(_indent(self._serialized_size_field("_i%d.second" % level_n, value_type, level_n + 1)))
                c.append("}")

        elif type_class == "string":
            c.append("_size += sizeof(messgen::size_type)")
            c.append("_size += %s.size()" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialized_size_field: %s" % field_type_def["type_class"])

        return c
