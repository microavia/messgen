import os


def to_camelcase(str):
    return ''.join(x for x in str.title().replace('_', '') if not x.isspace())

def to_kebabcase(str):
    return str.lower().replace(' ', '-')

class MdGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map

    def generate(self, out_dir):
        for module_name, module in self._modules_map.items():

            dts = []

            id_max_len = self.get_max_length_by_key("id", module["messages"],len("id")) + 1
            name_max_len = self.get_max_length_by_key("name", module["messages"],len("name")) * 2 + 5
            dict_max_len = self.get_max_length_by_key("descr", module["messages"],len("comment"))

            dts.append("# %s" % (module_name))
            dts.append("## messages")
            dts.append("| %s | %s | %s |" % (
                self.add_spase("id", id_max_len), 
                self.add_spase("yaml", name_max_len), 
                self.add_spase("Comment", dict_max_len)
                ))
            dts.append("|-%s-|-%s-|-%s-|" % (
                "-" * id_max_len, 
                "-" * name_max_len, 
                "-" * dict_max_len
                ))
                

            for msg in module["messages"]:
                dts.append('| %s | %s | %s |' % (
            self.add_spase(self.id_to_str(msg["id"]) , id_max_len), 
            self.add_spase( "[%s](#%s)" %( msg["name"], to_kebabcase(msg["name"])), name_max_len),
            self.add_spase(msg.get("descr") if  msg.get("descr") is not None else "" , dict_max_len)
            ))
            dts.append("")
            dts.append("")
            
            for msg in module["messages"]:
                dts.extend(self.generate_interface(msg))
                dts.append("")

            self.__write_file( out_dir + os.path.sep + module_name + ".md",  dts)


    def get_max_length_by_key  (self, key, data, min_len = 0):   
        max_len = min_len;
        for d in data:
            if  d.get(key) is not None and len(str(d[key])) > max_len:
                max_len = len(str(d[key]))
        return max_len

    def add_spase(self, value, max_len):
        if not (value):
            return " " * (max_len)

        return str( value ) + " " * (max_len - len(str( value )))

    def id_to_str(self, id):
        return str(id) if id != 0 else "0"

    def generate_interface(self, msg):
        msg_name = msg["name"]

        out = []
        out.append("### %s" % (msg_name))
        out.append("#### id:%s" % (msg["id"]))
        if msg.get("descr") is not None:
            out.append("#### "+msg["descr"])


        field_max_len = self.get_max_length_by_key("name", msg["fields"],len("Field"))
        type_max_len = self.get_max_length_by_key("type", msg["fields"],len("Tyepe"))
        dict_max_len = self.get_max_length_by_key("descr", msg["fields"],len("Comment"))

        out.append("| %s | %s | %s |" % (
            self.add_spase("Field", field_max_len), 
            self.add_spase("Tyepe", type_max_len), 
            self.add_spase("Comment", dict_max_len)
            ))

        out.append("|-%s-|-%s-|-%s-|" % (
            "-" * field_max_len, 
            "-" * type_max_len, 
            "-" * dict_max_len
            ))
        
        for f in msg["fields"]:
            f_name = f["name"]
            f_type = f["type"]

            out.append("| %s | %s | %s |" % (
                self.add_spase(f_name, field_max_len),
                self.add_spase(f_type, type_max_len),
                self.add_spase(f.get("descr") if  f.get("descr") is not None else "" , dict_max_len)
                ))
                
        out.append("")
        return out

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
