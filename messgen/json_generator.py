import os

json_types_map = {
    "bytes": "uint8[]",
}

def format_type(f):
    t = json_types_map.get(f["type"], f["type"])
    f_type = t[0].upper() + t[1:]
    if f["num"] > 1:
        f_type += "[%s]" % f["num"]
    elif f["is_dynamic"]:
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

            code.append("{")
            code_msgs = []
            for msg in module["messages"]:
                code_msgs.append("\n".join(self.generate_msg(msg)))
            code.append(",\n".join(code_msgs))
            code.append("}")

            self.__write_file(module_out_dir + os.path.sep + "messages.json", code)

    def generate_msg(self, msg):
        msg_name = msg["name"]

        out = []
        out.append('  "%s": {' % msg_name)
        if "id" in msg:
            out.append('    "id": %s,' % msg["id"])
        out.append('    "fields": [')
        fields_p = []
        for f in msg["fields"]:
            f_name = f["name"]
            f_type = format_type(f)
            fields_p.append('      {"name": "%s", "type": "%s"}' % (f_name, f_type))
        out.append(",\n".join(fields_p))
        out.append("    ]")
        out.append("  }")
        return out

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
