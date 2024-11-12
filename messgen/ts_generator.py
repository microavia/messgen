# ts_generator.py

import os
from .common import SEPARATOR 
from .protocols import Protocols

ts_types_map = {
    "bool": "boolean",
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
    "float64": "number",
    "string": "string",
    "bytes": "Uint8Array",
}

class TypeScriptGenerator:
    def __init__(self, protos: Protocols, options: dict):
        self.protos = protos
        self.options = options
        self.generated_types = {}
        self.imports = set()
        self.code_lines = []

    def to_camel_case(self, s):
        return ''.join(word.capitalize() for word in s.split('_'))

    def generate(self, out_dir, proto_name, proto):
        self.generated_types = {}
        self.imports = set()
        self.code_lines = []
        types = proto.get("types", {})
        proto_id = proto.get("proto_id", None)
        proto_comment = proto.get("comment", "")
        proto_version = proto.get("version", "")

        output_path = os.path.join(out_dir, proto_name.replace(SEPARATOR, os.sep))
        os.makedirs(output_path, exist_ok=True)
        output_file = os.path.join(output_path, f"{proto_name.split(SEPARATOR)[-1]}.ts")

        for type_name in types:
            self.generate_type(proto_name, type_name, types)

        code = '// === AUTO GENERATED CODE ===\n'
        if proto_comment:
            code += f'// {proto_comment}\n'
        code += f'// Protocol: {proto_name}\n'
        if proto_version:
            code += f'// Version: {proto_version}\n'
        code += '\n'

        if self.imports:
            code += self.generate_imports(out_dir, output_path)

        code += '\n'.join(self.code_lines)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(code)


    def generate_imports(self, out_dir, output_path):
        imports = ''

        for proto_name, type_name in sorted(self.imports):
            import_path = os.path.relpath(
                os.path.join(out_dir, proto_name.replace(SEPARATOR, os.sep), proto_name.split(SEPARATOR)[-1]),
                output_path
            ).replace('\\', '/')

            imports += f'import {{ {self.to_camel_case(type_name)} }} from "{import_path}";\n'
        return imports + '\n'
    
    
    def generate_type(self, proto_name, type_name, types):
        if (proto_name, type_name) in self.generated_types:
            return
        self.generated_types[(proto_name, type_name)] = True

        type_def = types[type_name]
        type_class = type_def.get("type_class")
        comment = type_def.get("comment", "")
        interface_name = self.to_camel_case(type_name)

        if type_class == "struct":
            fields = type_def.get("fields") or []
            for field in fields:
                field_type = field["type"]
                base_type = self.get_base_type(field_type)
                if not self.is_builtin_type(base_type):
                    self.handle_custom_type(base_type, proto_name)
        elif type_class == "enum":
            pass
        else:
            pass  

        if comment:
            self.code_lines.append(f"/** {comment} */")

        if type_class == "struct":
            self.code_lines.append(f"export interface {interface_name} {{")
            fields = type_def.get("fields") or []
            for field in fields:
                field_comment = field.get("comment", "")
                field_name = field["name"]
                field_type = field["type"]
                ts_type = self.get_ts_type(field_type, proto_name)
                if field_comment:
                    self.code_lines.append(f"  /** {field_comment} */")
                self.code_lines.append(f"  {field_name}: {ts_type};")
            self.code_lines.append("}\n")
        elif type_class == "enum":
            self.code_lines.append(f"export enum {interface_name} {{")
            values = type_def.get("values", [])
            for value in values:
                name = value["name"]
                value_value = value["value"]
                value_comment = value.get("comment", "")
                if value_comment:
                    self.code_lines.append(f"  /** {value_comment} */")
                self.code_lines.append(f"  {name} = {value_value},")
            self.code_lines.append("}\n")
        else:
            pass  

    def get_ts_type(self, field_type, current_proto_name):
        # Обработка массивов, карт и вложенных типов
        if field_type.endswith('[]'):
            base_type = field_type[:-2]
            ts_base_type = self.get_ts_type(base_type, current_proto_name)
            return f"{ts_base_type}[]"
        elif '[' in field_type and field_type.endswith(']'):
            index = field_type.find('[')
            base_type = field_type[:index]
            ts_base_type = self.get_ts_type(base_type, current_proto_name)
            return f"{ts_base_type}[]"
        elif '{' in field_type and field_type.endswith('}'):
            index = field_type.find('{')
            base_type = field_type[:index]
            key_type = field_type[index+1:-1]
            ts_base_type = self.get_ts_type(base_type, current_proto_name)
            ts_key_type = self.get_ts_type(key_type, current_proto_name)
            return f"{{ [key: {ts_key_type}]: {ts_base_type} }}"
        else:
            base_type = field_type
            if base_type in ts_types_map:
                return ts_types_map[field_type]
            elif self.is_builtin_type(base_type):
                return base_type
            else:
                return self.handle_custom_type(base_type, current_proto_name)

    def handle_custom_type(self, type_name, current_proto_name):
        if '/' in type_name:
            parts = type_name.split(SEPARATOR)
            other_proto_name = SEPARATOR.join(parts[:-1])
            other_type_name = parts[-1]
            self.imports.add((other_proto_name, other_type_name))
            return self.to_camel_case(other_type_name)
        else:
            return self.to_camel_case(type_name)

    def get_base_type(self, field_type):
        if '[' in field_type:
            return field_type.split('[')[0]
        elif '{' in field_type:
            return field_type.split('{')[0]
        elif field_type.endswith('[]'):
            return field_type[:-2]
        else:
            return field_type

    def is_builtin_type(self, type_name):
        return type_name in ts_types_map

