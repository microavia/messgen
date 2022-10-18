import os
from messgen.version_protocol import VersionProtocol

json_types_map = {
    "bytes": "uint8[]",
}


def format_type_name(module_path, typename):
    t = json_types_map.get(typename, typename)
    le = t.rfind('/')

    if le > 0 and module_path == t[:le]:
        f_type = t[le+1:]
    else:
        f_type = t[0].upper() + t[1:]

    return f_type


def format_type(module_path, f):
    f_type = format_type_name(module_path, f["type"])
    if f["num"] > 1:
        f_type += "[%s]" % f["num"]
    elif f["is_dynamic"] and (f["type"] != "string"):
        f_type += "[]"
    return f_type


class JsonGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map

    def generate(self, out_dir):
        for module_name, module in self._modules_map.items():
            module_out_dir = out_dir + os.path.sep + module_name.replace(self.MODULE_SEP, os.path.sep)

            try:
                os.makedirs(module_out_dir)
            except:
                pass

            code = []
            code_msgs = []
            for const in module["constants"]:
                code_msgs.append("\n".join(self.generate_constant(const)))

            if len(code_msgs) > 0:
                code.append("{")
                code.append(",\n".join(code_msgs))
                code.append("}")

                self.__write_file(module_out_dir + os.path.sep + "cosntants.json", code)

            code = []
            code_msgs = []

            code.append("{")
            for msg in module["messages"]:
                code_msgs.append("\n".join(self.generate_msg(msg)))
            code.append(",\n".join(code_msgs))
            code.append("}")

            self.__write_file(module_out_dir + os.path.sep + "messages.json", code) 


            code = []

            code.append("{")
            code.append("  \"version\": \"%s\"" % VersionProtocol(self._modules_map).generate())
            code.append("}")

            self.__write_file(module_out_dir + os.path.sep + "version.json", code)

    def generate_constant(self, msg):
        msg_name = msg["name"]

        out = []
        out.append('  "%s": {' % msg_name)
        out.append('    "type": "%s",' % format_type_name("", msg["basetype"]))
        out.append('    "is_const": true,')

        if "id" in msg:
           out.append('    "id": %s,' % msg["id"])

        out.append('    "fields": [')
        fields_p = self.generate_const_fields(msg)
        out.append(",\n".join(["      " + x for x in fields_p]))
        out.append("    ]")
        out.append("  }")
        return out

    def generate_const_fields(self, msg):
        fields_p = []

        for f in msg["fields"]:
            f_name = f["name"]
            fields_p.append('{"name": "%s", "value": %s"}' % (f_name, str(f["value"])))

        return fields_p

    def generate_msg(self, msg):
        msg_name = msg["name"]

        out = []
        out.append('  "%s": {' % msg_name)
        if "id" in msg:
            out.append('    "id": %s,' % msg["id"])

        out.append('    "fields": [')
        fields_p = self.generate_fields(msg)
        out.append(",\n".join(["      " + x for x in fields_p]))
        out.append("    ]")
        out.append("  }")
        return out

    def generate_fields(self, msg):
        fields_p = []
        module_path = msg["typename"]
        module_path = module_path[:module_path.rfind('/')]
        for f in msg["fields"]:
            f_name = f["name"]
            f_type = format_type(module_path, f)
            fields_p.append('{"name": "%s", "type": "%s"}' % (f_name, f_type))
        return fields_p

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
