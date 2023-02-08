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
    "int64": "bigint",
    "uint64": "bigint",
    "float32": "number",
    "float64": "bigint",
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
            prefix = '// === AUTO GENERATED CODE ===\n'
            imports.append(prefix)
            imports.append('import { MessageName, MessageData, ClearSystemInfo } from  "./%s"' % spl[1])
            imports.append('import { Messages, Struct } from "messgen"; // TODO: add alias in project or crate npm module\n')

            dts = []
            methods = []
            mes_names = []

            for msg in module["messages"]:
                dts += self.generate_interface(msg)
                mes_names.append(msg["name"])
                methods.append(self.generate_send(msg["name"]))
                methods.append(self.generate_on(msg["name"], msg["id"]))
            dts = dts + self.generate_names(mes_names)
            dts = dts + self.generate_datas(mes_names)
            dts += ["export type ClearSystemInfo<T extends MessageData> = Omit<T, '__type__'> \n"]
            self.__write_file( out_dir + os.path.sep + module_name + ".ts", [prefix] + dts)
            self.__write_file(out_dir + os.path.sep + "%sHelper.ts" % class_path, imports + self.generate_class(methods, to_camelcase(spl[1])))

    def generate_interface(self, msg):
        msg_name = msg["name"]

        out = []
        if msg.get("descr") is not  None:
            out.append("/**\n * %s" % msg["descr"])
            out.append(" */")
        out.append('export interface %sMessage {' % to_camelcase(msg_name))
        out.append('    __type__?: "%s"' % msg_name)
        fields_p = []
        for f in msg["fields"]:
            f_name = f["name"]
            f_type = format_type(f)
            if f.get("descr") is not None:
                fields_p.append('    /** %s */' % str(f.get("descr")))
            fields_p.append('    %s: %s' % (f_name, f_type))
        out.append("\n".join(fields_p))
        out.append("}")
        return out


    def generate_import(self, module_name, msg_name):
        return  'import { %sMessage } from "./%s/%s"\n' % (msg_name, module_name, msg_name)

    def generate_send(self, name):
        msg_name = to_camelcase(name)
        return  '''
    send_%s(data: ClearSystemInfo<MessageData<"%s">>, callback?: (data: ClearSystemInfo<MessageData<"%s">>) => void): any {
        return this.send(this.messages.MSG_%s, data, callback);
    }''' % (msg_name,name, name, name.upper())

    def generate_on(self, name, id):
        msg_name = to_camelcase(name)
        return  '''
    on_%s(callback: (data: MessageData<"%s">) => any) {
        this.onmessage[%s] = callback;
    }''' % (msg_name, name,  id)

    def generate_class(self, methods, name_file):
        out = []
        out.append('export default class %sHelper {' % (name_file))
        out.append("    send(struct: Struct, data: ClearSystemInfo<MessageData>, callback?: (...args: any) => any) {}")
        out.append("    protected onmessage: {(args?: any): void}[] = []")
        out.append("    protected messages!: Messages<MessageName>")
        out.append("\n".join(methods))
        out.append("}")
        return out

    def generate_names(self, names):
        out = []
        out.append("export type MessageName =")
        for name in iter(names):
            out.append('| "%s"' % name)
        out.append('\n')
        return out

    def generate_datas(self, names):
        out = []
        out.append("export type MessageData<TMessageName extends MessageName = MessageName>  =")
        for name in iter(names):
            out.append('    TMessageName extends "%s" ? ' % name)
            out.append('    %sMessage :' % to_camelcase(name))
        for name in iter(names):
            out.append('        | %sMessage ' % to_camelcase(name))
        out.append('\n')
        return out

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
