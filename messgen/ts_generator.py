import os
from typing import Dict, Set, List
from .protocols import Protocols
from .common import SEPARATOR

class TypeScriptTypes:
    TYPE_MAP = {
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

    @classmethod
    def get_type(cls, type_name):
        return cls.TYPE_MAP.get(type_name, type_name)

class TypeScriptGenerator:
    _protocols: Protocols
    _options: dict

    def __init__(self, protos, options):
        self._protocols = protos
        self._reset_state()
        self._options = options

    def _reset_state(self) -> None:
        self.generated_types: Dict[tuple, bool] = {}
        self.imports: Set[tuple] = set()
        self.code_lines: List[str] = []

    def generate(self, out_dir, proto_name, proto) -> None:
        self._reset_state()
        
        types = proto.get("types", {})
        proto_comment = proto.get("comment", "")
        proto_version = proto.get("version", "")
        proto_name = proto.get("proto_name", proto_name)

        output_path = self._create_output_dirs(out_dir, proto_name)
        
        for type_name in types:
            self._generate_type(proto_name, type_name, types)

        self._generate_types_map(proto_name, types)
        
        code = self._generate_file_content(
            proto_name=proto_name,
            proto_comment=proto_comment,
            proto_version=proto_version,
            out_dir=out_dir,
            output_path=output_path
        )

        self._write_output_file(output_path, proto_name, code)

    def _create_output_dirs(self, out_dir, proto_name):
        output_path = os.path.join(out_dir, proto_name.replace(SEPARATOR, os.sep))
        os.makedirs(output_path, exist_ok=True)
        return output_path

    def _generate_file_content(self, proto_name, proto_comment, proto_version, out_dir, output_path):
        self.code_lines.insert(0, '// === AUTO GENERATED CODE ===')
        
        if proto_comment:
            self.code_lines.insert(1, f'// {proto_comment}')
        self.code_lines.insert(2, f'// Protocol: {proto_name}')
        
        if proto_version:
            self.code_lines.insert(3, f'// Version: {proto_version}')
        self.code_lines.insert(4, "")

        if self.imports:
            import_lines = self._generate_imports(out_dir, output_path)
            self.code_lines = self.code_lines[:5] + import_lines + [""] + self.code_lines[5:]

        return '\n'.join(self.code_lines)

    def _generate_type(self, proto_name, type_name, types) -> None:
        if (proto_name, type_name) in self.generated_types:
            return
        self.generated_types[(proto_name, type_name)] = True

        type_def = types[type_name]
        type_class = type_def.get("type_class")
        comment = type_def.get("comment", "")
        interface_name = self._to_camel_case(type_name)

        self._handle_type_dependencies(type_def, type_class)
        self._generate_type_definition(
            type_class=type_class,
            interface_name=interface_name,
            type_def=type_def,
            comment=comment
        )

    def _handle_type_dependencies(self, type_def, type_class):
        if type_class == "struct":
            for field in type_def.get("fields", []):
                field_type = field["type"]
                base_type = self._get_base_type(field_type)
                if not self._is_builtin_type(base_type):
                    self._handle_custom_type(base_type)

    def _generate_type_definition(self, type_class, interface_name, type_def, comment):
        if comment:
            self.code_lines.append(f"/** {comment} */")

        if type_class == "struct":
            self._generate_interface(interface_name, type_def)
        elif type_class == "enum":
            self._generate_enum(interface_name, type_def)

    def _generate_interface(self, interface_name, type_def):
        self.code_lines.append(f"export interface {interface_name} {{")
        
        for field in type_def.get("fields", []):
            if field.get("comment"):
                self.code_lines.append(f"  /** {field['comment']} */")
            
            field_name = field["name"]
            field_type = self._get_ts_type(field["type"], type_def.get("proto_name", ""))
            self.code_lines.append(f"  {field_name}: {field_type};")
            
        self.code_lines.append("}")
        self.code_lines.append("")

    def _generate_enum(self, enum_name, type_def):
        self.code_lines.append(f"export enum {enum_name} {{")
        
        for value in type_def.get("values", []):
            if value.get("comment"):
                self.code_lines.append(f"  /** {value['comment']} */")
            self.code_lines.append(f"  {value['name'].capitalize()} = {value['value']},")
            
        self.code_lines.append("}")
        self.code_lines.append("")

    def _write_output_file(self, output_path, proto_name, content):
        output_file = os.path.join(
            output_path, 
            f"{proto_name.split(SEPARATOR)[-1]}.ts"
        )
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)

    def _generate_imports(self, out_dir, output_path):
        import_lines = []
        
        for proto_name, type_name in sorted(self.imports):
            import_path = self._calculate_import_path(
                out_dir, output_path, proto_name
            )
            import_lines.append(
                f'import {{ {self._to_camel_case(type_name)} }} from "{import_path}/{proto_name.split(SEPARATOR)[-1]}";'
            )
            
        return import_lines

    def _calculate_import_path(self, out_dir, output_path, proto_name):
        import_path = os.path.relpath(
            os.path.join(
                out_dir,
                proto_name.replace(SEPARATOR, os.sep)
            ),
            output_path
        ).replace('\\', '/')
        return import_path

    def _get_ts_type(self, field_type, current_proto_name):
        if field_type.endswith('[]'):
            base_type = field_type[:-2]
            ts_base_type = self._get_ts_type(base_type, current_proto_name)
            return f"{ts_base_type}[]"
            
        if '[' in field_type and field_type.endswith(']'):
            base_type = field_type[:field_type.find('[')]
            ts_base_type = self._get_ts_type(base_type, current_proto_name)
            return f"{ts_base_type}[]"
            
        if '{' in field_type and field_type.endswith('}'):
            base_type = field_type[:field_type.find('{')]
            key_type = field_type[field_type.find('{')+1:-1]
            ts_base_type = self._get_ts_type(base_type, current_proto_name)
            ts_key_type = self._get_ts_type(key_type, current_proto_name)
            return f"{{ [key: {ts_key_type}]: {ts_base_type} }}"
            
        if field_type in TypeScriptTypes.TYPE_MAP:
            return TypeScriptTypes.get_type(field_type)
            
        return self._handle_custom_type(field_type)

    def _handle_custom_type(self, type_name):
        if SEPARATOR in type_name:
            parts = type_name.split(SEPARATOR)
            proto_name = SEPARATOR.join(parts[:-1])
            imported_type_name = parts[-1]
            self.imports.add((proto_name, imported_type_name))
            return self._to_camel_case(imported_type_name)
        else:
            return self._to_camel_case(type_name)
    
    @staticmethod
    def _to_camel_case(s):
        return ''.join(word.capitalize() for word in s.split('_'))

    @staticmethod
    def _get_base_type(field_type):
        if '[' in field_type:
            return field_type.split('[')[0]
        if '{' in field_type:
            return field_type.split('{')[0]
        if field_type.endswith('[]'):
            return field_type[:-2]
        return field_type

    @staticmethod
    def _is_builtin_type(type_name):
        return type_name in TypeScriptTypes.TYPE_MAP

    def _generate_types_map(self, proto_name, types):
        interface_name = self._to_camel_case(proto_name.replace('/', '_') + '_types_map')
        self.code_lines.append(f"export interface {interface_name} {{")
        self.code_lines.append(f'  "{proto_name}": {{')
        for type_name in sorted(types.keys()):
            ts_type_name = self._to_camel_case(type_name)
            self.code_lines.append(f'    {type_name}: {ts_type_name};')
        self.code_lines.append('  };')
        self.code_lines.append('}')
        self.code_lines.append('')

    def generate_root_types_file(self, out_dir, proto_files):
        root_file_path = os.path.join(out_dir, 'types.ts')
        import_lines = []
        interface_names = []

        for proto in proto_files:
            proto_name = proto.get('proto_name')
            module_path = proto_name.replace(SEPARATOR, '/')
            interface_name = self._to_camel_case(proto_name.replace('/', '_') + '_types_map')
            import_path = f'./{module_path}/{proto_name.split(SEPARATOR)[-1]}'
            import_lines.append(f'import {{ {interface_name} }} from "{import_path}";')
            interface_names.append(interface_name)

        with open(root_file_path, 'w', encoding='utf-8') as f:
            f.write('// === AUTO GENERATED CODE ===\n')
            f.write(import_lines.join('\n'))
            f.write('\n')
            f.write(f"type CommonProtocolTypeMap = {' & '.join(interface_names)};\n")
