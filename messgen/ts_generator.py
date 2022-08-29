import os

ts_types_map = {
    "bytes": "uint8[]",
    "char": "string",
    "int8": "number",
    "uint8": "number",
    "int16": "number",
    "uint16": "number",
    "int32": "number",
    "uint32": "number",
    "int64": "number",
    "uint64": "number",
    "float32": "number",
    "float64": "number",
    "string": "string",

}

def to_camelcase(str):
    return ''.join(x for x in str.title().replace('_', '') if not x.isspace())

def format_type(f):
    t = ts_types_map.get(f["type"], f["type"])
    f_type = t[0].lower() + t[1:]

    if ('/' in f["type"]):
        din_type = to_camelcase(f_type.split('/').pop())
        f_type = din_type + "Message"

    if (f["is_array"]):
        f_type += "[]"

    return f_type

class TsGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map

    def generate(self, out_dir):
        imports = []
        for module_name, module in self._modules_map.items():
            module_out_dir = out_dir + os.path.sep + module_name.replace(self.MODULE_SEP, os.path.sep)
            spl = module_name.split(self.MODULE_SEP)
            class_path = '%s/%s' % (spl[0], to_camelcase(spl[1]))
            imports.append('import "./%s"\n' % spl[1])

            dts = []
            methods = []
            for msg in module["messages"]:
                dts += self.generate_interface(msg)
                methods.append(self.generate_send(msg["name"]))
                methods.append(self.generate_on(msg["name"], msg["id"]))
            self.__write_file( out_dir + os.path.sep + module_name + ".d.ts", dts)
            self.__write_file(out_dir + os.path.sep + "%sHelper.ts" % class_path, imports + self.generate_class(methods))

    def generate_interface(self, msg):
        msg_name = msg["name"]

        out = []
        out.append('interface %sMessage {' % to_camelcase(msg_name))
        fields_p = []
        for f in msg["fields"]:
            f_name = f["name"]
            f_type = format_type(f)
             if f.get("descr") is not None:
                fields_p.append('    // %s ' % str(f.get("descr")))
            fields_p.append('    %s: %s' % (f_name, f_type))
        out.append("\n".join(fields_p))
        out.append("}")
        return out


    def generate_import(self, module_name, msg_name):
        return  'import { %sMessage } from "./%s/%s"\n' % (msg_name, module_name, msg_name)

    def generate_send(self, name):
        msg_name = to_camelcase(name)
        return  '''
    send_%s(data: Partial<%sMessage>) {
        return this.send(this.messages.MSG_%s, data);
    }''' % (msg_name, msg_name, name.upper())

    def generate_on(self, name, id):
        msg_name = to_camelcase(name)
        return  '''
    on_%s(callback: (data: %sMessage) => any) {
        this.onmessage[%s] = callback;
    }''' % (msg_name, msg_name,  id)

    def generate_class(self, methods):
        out = []
        out.append('export class SocketMethods {')
        out.append("    send(id:number, data: any) {}")
        out.append("    onmessage: {(args?: any): void}[] = []")
        out.append("    messages: any")
        out.append("\n".join(methods))
        out.append("}")
        return out


    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
