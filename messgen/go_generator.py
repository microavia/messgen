import os

from messgen import MessgenException


def to_camelcase(str):
    return ''.join(x for x in str.title().replace('_', '') if not x.isspace())


def fmt_int8(var, t_info):
    return "buf[ptr] = byte(v.%s)" % var


def parse_int8(t_info):
    return " = %s(buf[ptr])" % t_info["element_type"]


def fmt_int(var, t_info):
    et = t_info["element_type"]
    if et.startswith("u"):
        return "binary.LittleEndian.Put%s(buf[ptr:], v.%s)" % (to_camelcase(et), var)
    else:
        return "binary.LittleEndian.PutU%s(buf[ptr:], u%s(v.%s))" % (et, et, var)


def parse_int(t_info):
    et = t_info["element_type"]
    if et.startswith("u"):
        return " = binary.LittleEndian.%s(buf[ptr:])" % to_camelcase(et)
    else:
        return " = %s(binary.LittleEndian.U%s(buf[ptr:]))" % (et, et)


def fmt_float(var, t_info):
    et = t_info["element_type"]
    bits = et[5:]
    return "binary.LittleEndian.PutUint%s(buf[ptr:], math.Float%sbits(v.%s))" % (bits, bits, var)


def parse_float(t_info):
    et = t_info["element_type"]
    bits = et[5:]
    return " = math.Float%sfrombits(binary.LittleEndian.Uint%s(buf[ptr:]))" % (bits, bits)


def fmt_custom(var, t_info):
    return "v.%s.Pack(buf[ptr:])" % var


def parse_custom(t_info):
    return ".Unpack(buf[ptr:])"


def sizeof_dynamic(var, t_info):
    return "4 + %i*len(v.%s)" % (t_info["element_size"], var)


def fmt_string(var, t_info):
    return "messgen.WriteString(buf[ptr:], v.%s)" % var


def parse_string(t_info):
    return " = messgen.ReadString(buf[ptr:])"


maproto_types = {
    "char": {"fmt": fmt_int8, "parse": parse_int8, "storage_type": "byte"},
    "int8": {"fmt": fmt_int8, "parse": parse_int8},
    "uint8": {"fmt": fmt_int8, "parse": parse_int8},
    "int16": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint16": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "int32": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint32": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "int64": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint64": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "float32": {"fmt": fmt_float, "parse": parse_float, "imports": ["math", "encoding/binary"]},
    "float64": {"fmt": fmt_float, "parse": parse_float, "imports": ["math", "encoding/binary"]},
    "string": {"fmt": fmt_string, "parse": parse_string, "imports": ["$MESSGEN_MODULE"]},
}


class GoGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map
        self._variables = variables

    def generate(self, out_dir):
        package = "message"

        for module_name, module in self._modules_map.items():
            module_out_dir = \
                out_dir + \
                os.path.sep + \
                module_name.replace(self.MODULE_SEP, os.path.sep) + \
                os.path.sep + \
                package

            try:
                if not os.path.isdir(module_out_dir):
                    os.makedirs(module_out_dir)
            except OSError as e:
                print(e)
                pass

            consts_code = ["package %s" % package, "", "const ProtoId = %s" % module["proto_id"]]
            self.__write_file(module_out_dir + os.path.sep + "message.go", consts_code)
            for msg in module["messages"]:
                code = ["package %s" % package, ""]
                code.extend(self.generate_msg(msg))
                self.__write_file(module_out_dir + os.path.sep + msg["name"] + ".go", code)

    def generate_msg(self, msg):
        msg_name = to_camelcase(msg["name"])
        fields = msg["fields"]

        code = []

        # Imports
        imports_code = ["import ("]

        # Struct
        struct_code = ["type %s struct {" % msg_name]
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(field)
            struct_code.append("\t%s %s" % (field_name, type_info["storage_type"]))
            if "imports" in type_info:
                for i in type_info["imports"]:
                    if "$MESSGEN_MODULE" in i:
                        try:
                            messgen_go_module = self._variables["messgen_go_module"]
                        except KeyError:
                            raise MessgenException(
                                "Variable 'messgen_go_module' required but not set, set it with -D option")

                        i = i.replace("$MESSGEN_MODULE", messgen_go_module)
                    s = '    \"' + i + '\"'
                    if s not in imports_code:
                        imports_code.append(s)
        imports_code.append('    "fmt"')
        struct_code.append("}")
        struct_code.append("")

        imports_code.append(")")
        imports_code.append("")

        code.extend(imports_code)
        code.extend(struct_code)

        # Constants
        if "id" in msg:
            code.append("const %sMsgId = %i" % (msg_name, msg["id"]))
        code.append("const %sMinMsgSize = %i" % (msg_name, self.min_msg_size(fields)))
        code.append("")

        # Type
        if "id" in msg:
            code.append("func (v *%s) MsgId() int {" % msg_name)
            code.append("\treturn %d" % msg["id"])
            code.append("}")
            code.append("")

        # Size
        code.append("func (v *%s) MsgSize() int {" % msg_name)
        size_str_p = []
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(field)
            s = type_info["total_size"]
            if isinstance(s, int):
                size_str_p.append(str(s))
            else:
                size_str_p.append(s(field_name, type_info))
        if len(size_str_p) > 0:
            size_str = " + ".join(size_str_p)
        else:
            size_str = "0"
        code.append("\treturn %s" % size_str)
        code.append("}")
        code.append("")

        # Pack
        code.append("func (v *%s) Pack(buf []byte) (int, error) {" % msg_name)
        code.append("\tif len(buf) < v.MsgSize() {")
        code.append(
            '\t\treturn 0, fmt.Errorf("invalid buffer size for packing %s: %%d, should be >=%%d", len(buf), v.MsgSize())' % msg_name)
        code.append("\t}")
        code.append("\tptr := 0")
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(field)
            if type_info == None:
                raise Exception("Unsupported type: " + field["type"] + " in message " + msg["name"])
            if type_info["is_dynamic"]:
                code.append("\tbinary.LittleEndian.PutUint32(buf[ptr:], uint32(len(v.%s)))" % field_name)
                code.append("\tptr += 4")
                if type_info["element_size"] == 1:
                    code.append("\tcopy(buf[ptr:], []byte(v.%s))" % field_name)
                    code.append("\tptr += len(v.%s)" % field_name)
                else:
                    code.append("\tfor i := 0; i < len(v.%s); i++ {" % field_name)
                    code.append("\t\t%s" % (type_info["fmt"](field_name + "[i]", type_info)))
                    code.append("\t\tptr += %s" % type_info["element_size"])
                    code.append("\t}")
            elif type_info["is_array"]:
                var = "%s[i]" % to_camelcase(field["name"])
                code.append("\tfor i := 0; i < %s; i++ {" % type_info["array_size"])
                code.append("\t\t%s" % (type_info["fmt"](var, type_info)))
                code.append("\t\tptr += %s" % type_info["element_size"])
                code.append("\t}")
            else:
                var = to_camelcase(field["name"])
                code.append("\t%s" % (type_info["fmt"](var, type_info)))
                code.append("\tptr += %s" % self.total_size_str(field_name, type_info))
        code.append("\treturn ptr, nil")
        code.append("}")
        code.append("")

        # Unpack
        code.append("func (v *%s) Unpack(buf []byte) error {" % msg_name)
        code.append("\tif len(buf) < %sMinMsgSize {" % msg_name)
        code.append(
            "\t\treturn fmt.Errorf(\"invalid buffer size for unpacking %s: %%d, should be >=%%d\", len(buf), %sMinMsgSize)" % (
                msg_name, msg_name))
        code.append("\t}")
        if len(fields) > 0:
            code.append("\tptr := 0")
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(field)
            if type_info["is_dynamic"]:
                if type_info["element_size"] == 1:
                    code.append("\t{")
                    code.append("\t\tn := int(binary.LittleEndian.Uint32(buf[ptr:]))")
                    code.append("\t\tptr += 4")
                    code.append("\t\tv.%s = make([]%s, n)" % (field_name, type_info["element_type"]))
                    code.append("\t\tcopy(v.%s, buf[ptr : ptr+n])" % field_name)
                    code.append("\t\tptr += len(v.%s)" % field_name)
                    code.append("\t}")
                else:
                    code.append("\t{")
                    code.append("\t\tn := int(binary.LittleEndian.Uint32(buf[ptr:]))")
                    code.append("\t\tptr += 4")
                    code.append("\t\tfor i := 0; i < n; i++ {")
                    code.append("\t\t\tv.%s[i]%s" % (field_name, type_info["parse"](type_info)))
                    code.append("\t\t\tptr += %s" % type_info["element_size"])
                    code.append("\t\t}")
                    code.append("\t}")
            elif type_info["is_array"]:
                code.append("\tfor i := 0; i < %s; i++ {" % type_info["array_size"])
                code.append("\t\tv.%s[i]%s" % (field_name, type_info["parse"](type_info)))
                code.append("\t\tptr += %s" % type_info["element_size"])
                code.append("\t}")
            else:
                code.append("\tv.%s%s" % (field_name, type_info["parse"](type_info)))
                code.append("\tptr += %s" % self.total_size_str(field_name, type_info))
        code.append("\treturn nil")
        code.append("}")
        code.append("")

        # String()
        code.append('func (v *%s) String() string {' % msg_name)
        s = []
        for field in fields:
            s.append("%s=%%v" % (field["name"],))
        code.append('\treturn fmt.Sprintf("<%s %s>",' % (msg_name, " ".join(s),))
        a = []
        for field in fields:
            a.append("v.%s" % (to_camelcase(field["name"])))
        code.append("\t\t%s)" % (", ".join(a),))
        code.append("}")
        code.append("")
        return code

    def get_type_info(self, f):
        t = f["type"]

        type_info = dict(maproto_types[t])
        type_info["name"] = f["name"]
        static_size = self._data_types_map[t]["static_size"]
        type_info["is_array"] = f["is_array"]
        type_info["array_size"] = f["num"]

        if "storage_type" not in type_info:
            type_info["storage_type"] = t

        # TODO: FIXME
        if t != "string":
            type_info["is_dynamic"] = f["is_dynamic"]
        else:
            type_info["is_dynamic"] = False
            type_info["total_size"] = sizeof_dynamic

        type_info["element_type"] = type_info["storage_type"]
        type_info["element_size"] = static_size
        if "imports" not in type_info:
            type_info["imports"] = []

        if type_info["is_dynamic"]:
            type_info["total_size"] = sizeof_dynamic
            type_info["storage_type"] = "[]" + type_info["storage_type"]
            type_info["imports"].append("encoding/binary")
        elif type_info["is_array"]:
            type_info["total_size"] = static_size * f["num"]
            type_info["storage_type"] = "[" + str(f["num"]) + "]" + type_info["storage_type"]
        else:
            if "total_size" not in type_info:
                type_info["total_size"] = static_size

        return type_info

    def total_size_str(self, field_name, type_info):
        s = type_info["total_size"]
        if isinstance(s, int):
            return str(s)
        else:
            return s(field_name, type_info)

    def min_msg_size(self, fields):
        ptr = 0
        for f in fields:
            t_info = self.get_type_info(f)
            s = t_info["total_size"]
            if isinstance(s, int):
                ptr = ptr + s
            else:
                ptr += 2
        return ptr

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
