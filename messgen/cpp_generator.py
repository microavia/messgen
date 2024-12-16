import json
import os
import textwrap

from contextlib import contextmanager
from dataclasses import asdict
from pathlib import (
    PosixPath,
    Path,
)

from .common import (
    SEPARATOR,
    SIZE_TYPE,
    write_file_if_diff,
)
from .model import (
    ArrayType,
    BasicType,
    EnumType,
    EnumValue,
    FieldType,
    MapType,
    MessgenType,
    Protocol,
    StructType,
    TypeClass,
    VectorType,
)


def _unqual_name(type_name: str) -> str:
    return PosixPath(type_name).stem


def _qual_name(type_name: str) -> str:
    return type_name.replace(SEPARATOR, "::")


def _split_last_name(type_name) -> tuple[str, str]:
    split_name = type_name.split(SEPARATOR)
    return SEPARATOR.join(split_name[:-1]), split_name[-1]


@contextmanager
def _namespace(name: str, code:list[str]):
    ns_name = None
    try:
        ns_name = _qual_name(name)
        if ns_name:
            code.append(f"namespace {ns_name} {{")
            code.append("")
        yield

    finally:
        if ns_name:
            code.append("")
            code.append(f"}} // namespace {ns_name}")
            code.append("")


@contextmanager
def _struct(name: str, code: list[str]):
    try:
        code.append(f"struct {name} {{")
        yield
    finally:
        code.append("};")
        code.append("")


def _inline_comment(type_def: FieldType | EnumValue):
    try:
        return "  ///< %s" % type_def.comment
    finally:
        return ""


def _indent(c):
    spaces = "    "
    if type(c) is str:
        return spaces + c
    elif type(c) is list:
        r = []
        for i in c:
            r.append(spaces + i if i else "")
        return r
    else:
        raise RuntimeError("Unsupported type for indent: %s" % type(c))


class FieldsGroup:
    def __init__(self) -> None:
        self.fields: list = []
        self.field_names: list = []
        self.size: int = 0

    def __repr__(self) -> str:
        return str(self)

    def __str__(self) -> str:
        return "<FieldsGroup size=%s fields=%s>" % (self.size, self.field_names)


class CppGenerator:
    _PREAMBLE_HEADER = ["#pragma once", ""]
    _EXT_HEADER = ".h"
    _CPP_TYPES_MAP = {
        "bool": "bool",
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

    def __init__(self, options: dict):
        self._options: dict = options
        self._includes: set = set()
        self._ctx: dict = {}
        self._types: dict[str, MessgenType] = {}

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        self._types = types
        for type_name, type_def in types.items():
            if type_def.type_class not in [TypeClass.struct, TypeClass.enum]:
                continue
            file_name = out_dir / (type_name + self._EXT_HEADER)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            write_file_if_diff(file_name, self._generate_type_file(type_name, type_def))

    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        for proto_name, proto_def in protocols.items():
            file_name = out_dir / (proto_name + self._EXT_HEADER)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            write_file_if_diff(file_name, self._generate_proto_file(proto_name, proto_def))

    def _get_mode(self):
        return self._options.get("mode", "stl")

    def _get_cpp_standard(self):
        return int(self._options.get("cpp_standard", "11"))

    def _reset_file(self):
        self._includes.clear()

    def _generate_type_file(self, type_name: str, type_def: MessgenType) -> list:
        print(f"Generate type: {type_name}")
        self._reset_file()
        code: list[str] = []

        with _namespace(_split_last_name(type_name)[0], code):
            if isinstance(type_def, EnumType):
                code.extend(self._generate_type_enum(type_name, type_def))

            elif isinstance(type_def, StructType):
                code.extend(self._generate_type_struct(type_name, type_def))
                code.extend(self._generate_members_of(type_name, type_def))

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_proto_file(self, proto_name: str, proto_def: Protocol) -> list[str]:
        print("Generate protocol file: %s" % proto_name)

        self._reset_file()
        code: list[str] = []

        self._add_include("cstdint")
        self._add_include("messgen/messgen.h")

        namespace_name, class_name = _split_last_name(proto_name)
        print(f"Namespace: {namespace_name}, Class: {class_name}")
        with _namespace(namespace_name, code):
            with _struct(class_name, code):
                for message in proto_def.messages.values():
                    self._add_include(message.type + self._EXT_HEADER)

                proto_id = proto_def.proto_id
                if proto_id is not None:
                    code.append(f"    constexpr static inline int HASH = 0x{hash(proto_def):x};")
                    code.append(f"    constexpr static inline int PROTO_ID = {proto_id};")

                code.extend(self._generate_type_id_decl(proto_def))
                code.extend(self._generate_reflect_type_decl())
                code.extend(self._generate_dispatcher_decl())

            code.extend(self._generate_type_ids(class_name, proto_def))
            code.extend(self._generate_reflect_type(class_name, proto_def))
            code.extend(self._generate_dispatcher(class_name))
            code.append("")

        return self._PREAMBLE_HEADER + self._generate_includes() + code

    @staticmethod
    def _generate_type_id_decl(proto: Protocol) -> list[str]:
        return textwrap.indent(textwrap.dedent("""
            template <messgen::type Msg>
            constexpr static inline int TYPE_ID = [] {
                static_assert(sizeof(Msg) == 0, \"Provided type is not part of the protocol.\");
                return 0;
            }();"""), "    ").splitlines()

    @staticmethod
    def _generate_type_ids(class_name: str, proto: Protocol) -> list[str]:
        code: list[str] = []
        for type_id, message in proto.messages.items():
            code.append("template <>")
            code.append(f"constexpr inline int {class_name}::TYPE_ID<{_qual_name(message.type)}> = {type_id};")
        code.append("")
        return code

    @staticmethod
    def _generate_reflect_type_decl() -> list[str]:
        return textwrap.indent(textwrap.dedent("""
            template <class Fn>
            constexpr static auto reflect_message(int msg_id, Fn &&fn);
            """), "    ").splitlines()

    @staticmethod
    def _generate_reflect_type(class_name: str, proto: Protocol) -> list[str]:
        code: list[str] = []
        code.append("template <class Fn>")
        code.append(f"constexpr auto {class_name}::reflect_message(int msg_id, Fn &&fn) {{")
        code.append("    switch (msg_id) {")
        for message in proto.messages.values():
            qual_name = _qual_name(message.type)
            code.append(f"        case TYPE_ID<{qual_name}>:")
            code.append(f"            std::forward<Fn>(fn)(::messgen::reflect_type<{qual_name}>);")
            code.append(f"            return;")
        code.append("    }")
        code.append("}")
        return code

    @staticmethod
    def _generate_dispatcher_decl() -> list[str]:
        return textwrap.indent(textwrap.dedent("""
            template <class T>
            static bool dispatch_message(int msg_id, const uint8_t *payload, T handler);
            """), "    ").splitlines()

    @staticmethod
    def _generate_dispatcher(class_name: str) -> list[str]:
        return textwrap.dedent(f"""
            template <class T>
            bool {class_name}::dispatch_message(int msg_id, const uint8_t *payload, T handler) {{
                auto result = false;
                reflect_message(msg_id, [&]<class R>(R) {{
                    using message_type = messgen::splice_t<R>;
                    if constexpr (requires(message_type msg) {{ handler(msg); }}) {{
                        message_type msg;
                        msg.deserialize(payload);
                        handler(std::move(msg));
                        result = true;
                    }}
                }});
                return result;
            }}""").splitlines()

    @staticmethod
    def _generate_traits() -> list[str]:
        return textwrap.dedent("""
            namespace messgen {
                template <class T>
                struct reflect_t {};

                template <class T>
                struct splice_t {};
            }""").splitlines()

    @staticmethod
    def _generate_comment_type(type_def):
        if not type_def.comment:
            return []

        code = []
        code.append("/**")
        code.append(" * %s" % type_def.comment)
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type_def):
        self._add_include("messgen/messgen.h")

        unqual_name = _unqual_name(type_name)
        qual_name = _qual_name(type_name)

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append(f"enum class {unqual_name}: {self._cpp_type(type_def.base_type)} {{")
        for enum_value in type_def.values:
            code.append("    %s = %s,%s" % (enum_value.name, enum_value.value, _inline_comment(enum_value)))
        code.append("};")

        code.append("")
        code.append(f"[[nodiscard]] inline constexpr std::string_view name_of(::messgen::reflect_t<{unqual_name}>) noexcept {{")
        code.append(f"    return \"{qual_name}\";")
        code.append("}")

        return code

    def _get_alignment(self, type_def: MessgenType):
        type_class = type_def.type_class

        if isinstance(type_def, BasicType):
            if type_class in [TypeClass.scalar]:
                return type_def.size
            elif type_class in [TypeClass.string, TypeClass.bytes]:
                return self._get_alignment(self._types[SIZE_TYPE])

        if isinstance(type_def, EnumType):
            return type_def.size

        elif isinstance(type_def, StructType):
            # Alignment of struct is equal to max of the field alignments
            a_max = 0
            for field in type_def.fields:
                a = self._get_alignment(self._types[field.type])
                if a > a_max:
                    a_max = a
            return a_max

        elif isinstance(type_def, ArrayType):
            # Alignment of array is equal to alignment of element
            return self._get_alignment(self._types[type_def.element_type])

        elif isinstance(type_def, VectorType):
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._types[SIZE_TYPE])
            a_el = self._get_alignment(self._types[type_def.element_type])
            return max(a_sz, a_el)

        elif isinstance(type_def, MapType):
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._types[SIZE_TYPE])
            a_key = self._get_alignment(self._types[type_def.key_type])
            a_value = self._get_alignment(self._types[type_def.value_type])
            return max(a_sz, a_key, a_value)

        else:
            raise RuntimeError("Unsupported type_class in _get_alignment: %s" % type_class)

    def _check_alignment(self, type_def, offs):
        align = self._get_alignment(type_def)
        return offs % align == 0

    def _generate_type_struct(self, type_name: str, type_def: StructType):
        fields = type_def.fields

        self._add_include("cstddef")
        self._add_include("cstring")
        self._add_include("messgen/messgen.h")

        unqual_name = _unqual_name(type_name)

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append(f"struct {unqual_name} {{")

        groups = self._field_groups(fields)
        if len(groups) > 1 and self._all_fields_scalar(fields):
            print("Warn: padding in '%s' after '%s' causes extra memcpy call during serialization." % (
                type_name, groups[0].fields[0].name))

        # IS_FLAT flag
        is_flat_str = "false"
        is_empty = len(groups) == 0
        is_flat = is_empty or (len(groups) == 1 and groups[0].size is not None)
        if is_flat:
            code.append(_indent("constexpr static inline size_t FLAT_SIZE = %d;" % (0 if is_empty else groups[0].size)))
            is_flat_str = "true"
        code.append(_indent(f"constexpr static inline bool IS_FLAT = {is_flat_str};"))
        code.append(_indent(f"constexpr static inline uint32_t HASH = 0x{hash(type_def):x};"))
        code.append(_indent(f"constexpr static inline const char* NAME = \"{_qual_name(type_name)}\";"))
        code.append(_indent(f"constexpr static inline const char* SCHEMA = R\"_({self._generate_schema(type_def)})_\";"))
        code.append("")

        for field in type_def.fields:
            field_c_type = self._cpp_type(field.type)
            code.append(_indent(f"{field_c_type} {field.name}; {_inline_comment(field)}"))

        # Serialize function
        code_ser = []

        code_ser.extend([
            "size_t _size = 0;",
            "[[maybe_unused]] size_t _field_size;",
            "",
        ])

        for group in groups:
            if len(group.fields) > 1:
                # There is padding before current field
                # Write together previous aligned fields, if any
                code_ser.append("// %s" % ", ".join(group.field_names))
                code_ser.extend(self._memcpy_to_buf("&" + group.fields[0].name, group.size))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_name = field.name
                field_type_def = self._types.get(field.type)
                code_ser.extend(self._serialize_field(field_name, field_type_def))
            code_ser.append("")
        code_ser.append("return _size;")

        code_ser = ["",
                    "size_t serialize(uint8_t *" + ("_buf" if not is_empty else "") + ") const {",
                    ] + _indent(code_ser) + [
                    "}"]
        code.extend(_indent(code_ser))

        # Deserialize function
        code_deser = []

        code_deser.extend([
            "size_t _size = 0;",
            "[[maybe_unused]] size_t _field_size;",
            "",
        ])

        groups = self._field_groups(fields)
        for group in groups:
            if len(group.fields) > 1:
                # There is padding before current field
                # Write together previous aligned fields, if any
                code_deser.append("// %s" % ", ".join(group.field_names))
                code_deser.extend(self._memcpy_from_buf("&" + group.fields[0].name, group.size))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_type_def = self._types.get(field.type)
                code_deser.extend(self._deserialize_field(field.name, field_type_def))
            code_deser.append("")
        code_deser.append("return _size;")

        alloc = ""
        if self._get_mode() == "nostl":
            alloc = ", messgen::Allocator &_alloc"
        code_deser = ["",
                      "size_t deserialize(const uint8_t *" + ("_buf" if not is_empty else "") + alloc + ") {",
                      ] + _indent(code_deser) + [
                      "}"]
        code.extend(_indent(code_deser))

        # Size function
        code_ss = []

        fixed_size = 0
        fixed_fields = []
        for field in fields:
            field_type_def = self._types[field.type]
            field_size = field_type_def.size

            if field_size is None:
                code_ss.extend(self._serialized_size_field(field.name, field_type_def))
                code_ss.append("")
            else:
                fixed_fields.append(field.name)
                fixed_size += field_size

        code_ss.append("return _size;")

        code_ss = ["",
                   "[[nodiscard]] size_t serialized_size() const {",
                   _indent("// %s" % ", ".join(fixed_fields)),
                   _indent("size_t _size = %d;" % fixed_size),
                   "",
                   ] + _indent(code_ss) + [
                      "}"]
        code.extend(_indent(code_ss))



        if self._get_cpp_standard() >= 20:
            # Operator <=>
            code.append("")
            code.append(_indent("auto operator<=>(const %s&) const = default;" % unqual_name))

        code.append("};")

        if self._get_cpp_standard() < 20:
            # Operator ==
            code_eq = []
            if len(fields) > 0:
                field_name = fields[0].name
                code_eq.append("return l.%s == r.%s" % (field_name, field_name))
                for field in fields[1:]:
                    field_name = field.name
                    code_eq.append("   and l.%s == r.%s" % (field_name, field_name))
            else:
                code_eq.append("return true")
            code_eq[-1] += ";"

            code.extend([
                            "",
                            f"bool operator==(const {unqual_name}& l, const {unqual_name}& r) {{",
                        ] + _indent(code_eq) + [
                            "}"
                        ])

        return code

    @staticmethod
    def _generate_schema(type_def: MessgenType):
        return json.dumps(asdict(type_def)).replace(" ", "")

    def _add_include(self, inc, scope="global"):
        self._includes.add((inc, scope))

    def _generate_includes(self):
        code = []
        for inc in sorted(list(self._includes)):
            if inc[1] == "local":
                code.append("#include \"%s\"" % inc[0])
            else:
                code.append("#include <%s>" % inc[0])
        if len(code) > 0:
            code.append("")
        return code

    def _generate_members_of(self, type_name: str, type_def: StructType):
        self._add_include("tuple")

        unqual_name = _unqual_name(type_name)

        code: list[str] = []
        code.append("")
        code.append(f"[[nodiscard]] consteval auto members_of(::messgen::reflect_t<{unqual_name}>) noexcept {{")
        code.append("    return std::tuple{")
        for field in type_def.fields:
            code.append(f"        ::messgen::member{{\"{field.name}\", &{unqual_name}::{field.name}}},")
        code.append("    };")
        code.append("}")

        return code

    def _cpp_type(self, type_name: str) -> str:
        type_def = self._types[type_name]
        mode = self._get_mode()

        if isinstance(type_def, BasicType):

            if type_def.type_class == TypeClass.scalar:
                self._add_include("cstdint")
                return self._CPP_TYPES_MAP[type_name]

            elif type_def.type_class == TypeClass.string:
                if mode == "stl":
                    self._add_include("string")
                    return "std::string"
                elif mode == "nostl":
                    self._add_include("string_view")
                    return "std::string_view"
                else:
                    raise RuntimeError("Unsupported mode for string: %s" % mode)

            elif type_def.type_class == TypeClass.bytes:
                if mode == "stl":
                    self._add_include("vector")
                    return "std::vector<uint8_t>"
                elif mode == "nostl":
                    return "messgen::vector<uint8_t>"
                else:
                    raise RuntimeError("Unsupported mode for bytes: %s" % mode)

        elif isinstance(type_def, ArrayType):
            self._add_include("array")
            el_c_type = self._cpp_type(type_def.element_type)
            return "std::array<%s, %d>" % (el_c_type, type_def.array_size)

        elif isinstance(type_def, VectorType):
            el_c_type = self._cpp_type(type_def.element_type)
            if mode == "stl":
                self._add_include("vector")
                return "std::vector<%s>" % el_c_type
            elif mode == "nostl":
                return "messgen::vector<%s>" % el_c_type
            else:
                raise RuntimeError("Unsupported mode for vector: %s" % mode)

        elif isinstance(type_def, MapType):
            key_c_type = self._cpp_type(type_def.key_type)
            value_c_type = self._cpp_type(type_def.value_type)
            if mode == "stl":
                self._add_include("map")
                return "std::map<%s, %s>" % (key_c_type, value_c_type)
            elif mode == "nostl":
                self._add_include("span")
                return "std::span<std::pair<%s, %s>>" % (key_c_type, value_c_type)
            else:
                raise RuntimeError("Unsupported mode for map: %s" % mode)

        elif isinstance(type_def, (EnumType, StructType)):
            scope = ("global"
                     if SEPARATOR in type_name
                     else "local")
            self._add_include("%s.h" % type_name, scope)
            return _qual_name(type_name)

        raise RuntimeError("Can't get c++ type for %s" % type_name)

    def _all_fields_scalar(self, fields: list[FieldType]):
        return all(self._types[field.type].type_class != TypeClass.scalar
                   for field in fields)

    def _field_groups(self, fields):
        groups = [FieldsGroup()] if len(fields) > 0 else []
        for field in fields:
            field_def = self._types.get(field.type)
            align = self._get_alignment(field_def)
            size = field_def.size

            # Check if there is padding before this field
            if len(groups[-1].fields) > 0 and (
                    (size is None) or
                    (groups[-1].size is None) or
                    (groups[-1].size % align != 0) or
                    (size % align != 0)):
                # Start next group
                groups.append(FieldsGroup())

            groups[-1].fields.append(field)
            groups[-1].field_names.append(field.name)
            if groups[-1].size is not None:
                if size is not None:
                    groups[-1].size += size
                else:
                    groups[-1].size = None

        return groups

    def _serialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def.type_class

        c.append("// %s" % field_name)
        if type_class in [TypeClass.scalar, TypeClass.enum]:
            c_type = self._cpp_type(field_type_def.type)
            size = field_type_def.size
            c.append("*reinterpret_cast<%s *>(&_buf[_size]) = %s;" % (c_type, field_name))
            c.append("_size += %s;" % size)

        elif type_class == TypeClass.struct:
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)

        elif type_class in [TypeClass.array, TypeClass.vector]:
            if type_class == TypeClass.vector:
                c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
                c.append("_size += sizeof(messgen::size_type);")
            el_type_def = self._types.get(field_type_def.element_type)
            el_size = el_type_def.size
            el_align = self._get_alignment(el_type_def)

            if el_size == 0:
                pass
            elif el_size is not None and el_size % el_align == 0:
                # Vector of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                c.extend(self._memcpy_to_buf("%s.data()" % field_name, "_field_size"))
            else:
                # Vector of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                c.append("}")

        elif type_class == TypeClass.map:
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            key_type_def = self._types.get(field_type_def.key_type)
            value_type_def = self._types.get(field_type_def.value_type)
            c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
            c.extend(
                _indent(self._serialize_field("_i%d.first" % level_n, key_type_def, level_n + 1)))
            c.extend(_indent(
                self._serialize_field("_i%d.second" % level_n, value_type_def, level_n + 1)))
            c.append("}")

        elif type_class == TypeClass.string:
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            c.append("%s.copy(reinterpret_cast<char *>(&_buf[_size]), %s.size());" % (field_name, field_name))
            c.append("_size += %s.size();" % field_name)

        elif type_class == TypeClass.bytes:
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            c.append("std::copy(%s.begin(), %s.end(), &_buf[_size]);" % (field_name, field_name))
            c.append("_size += %s.size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialize_field: %s" % type_class)

        return c

    def _deserialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def.type_class
        mode = self._get_mode()

        c.append("// %s" % field_name)
        if type_class in [TypeClass.scalar, TypeClass.enum]:
            c_type = self._cpp_type(field_type_def.type)
            size = field_type_def.size
            c.append("%s = *reinterpret_cast<const %s *>(&_buf[_size]);" % (field_name, c_type))
            c.append("_size += %s;" % size)

        elif type_class == TypeClass.struct:
            alloc = ""
            if mode == "nostl":
                alloc = ", _alloc"
            c.append("_size += %s.deserialize(&_buf[_size]%s);" % (field_name, alloc))

        elif type_class == TypeClass.array:
            el_type_def = self._types.get(field_type_def.element_type)
            el_size = el_type_def.size
            el_align = self._get_alignment(el_type_def)
            if el_size == 0:
                pass
            elif el_size is not None and el_size % el_align == 0:
                # Vector or array of fixed size elements, optimize with single memcpy
                c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                c.extend(self._memcpy_from_buf("%s.data()" % field_name, "_field_size"))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                c.append("}")

        elif type_class == TypeClass.vector:
            if mode == "stl":
                el_type_def = self._types.get(field_type_def.element_type)
                el_size = el_type_def.size
                el_align = self._get_alignment(el_type_def)
                c.append("%s.resize(*reinterpret_cast<const messgen::size_type *>(&_buf[_size]));" % field_name)
                c.append("_size += sizeof(messgen::size_type);")
                if el_size == 0:
                    pass
                elif el_size is not None and el_size % el_align == 0:
                    # Vector or array of fixed size elements, optimize with single memcpy
                    c.append("_field_size = %d * %s.size();" % (el_size, field_name))
                    c.extend(self._memcpy_from_buf("%s.data()" % field_name, "_field_size"))
                else:
                    # Vector or array of variable size elements
                    c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                    c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                    c.append("}")
            elif mode == "nostl":
                el_type_def = self._types.get(field_type_def.element_type)
                el_c_type = self._cpp_type(field_type_def.element_type)
                el_size = el_type_def.size
                el_align = self._get_alignment(el_type_def)
                c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
                c.append(f"{field_name} = {{_alloc.alloc<{el_c_type}>(_field_size), _field_size}};")
                c.append("_size += sizeof(messgen::size_type);")
                if el_size == 0:
                    pass
                elif el_size is not None and el_size % el_align == 0:
                    # Vector or array of fixed size elements, optimize with single memcpy
                    if el_size != 1:
                        c.append("_field_size *= %d;" % el_size)
                    c.extend(self._memcpy_from_buf("%s.data()" % field_name, "_field_size"))
                else:
                    # Vector or array of variable size elements
                    c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                    c.extend(_indent(self._deserialize_field("_i%d" % level_n, el_type_def, level_n + 1)))
                    c.append("}")

        elif type_class == TypeClass.map:
            c.append("{")
            c.append(_indent("size_t _map_size%d = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);" % level_n))
            c.append(_indent("_size += sizeof(messgen::size_type);"))
            key_c_type = self._cpp_type(field_type_def.key_type)
            key_type_def = self._types.get(field_type_def.key_type)
            value_c_type = self._cpp_type(field_type_def.value_type)
            value_type_def = self._types.get(field_type_def.value_type)
            c.append(
                _indent(
                    "for (size_t _i%d = 0; _i%d < _map_size%d; ++_i%d) {" % (level_n, level_n, level_n, level_n)))
            c.append(_indent(_indent("%s _key%d;" % (key_c_type, level_n))))
            c.append(_indent(_indent("%s _value%d;" % (value_c_type, level_n))))
            c.append("")
            c.extend(_indent(
                _indent(
                    self._deserialize_field("_key%d" % level_n, key_type_def, level_n + 1))))
            c.extend(_indent(_indent(
                self._deserialize_field("_value%d" % level_n, value_type_def, level_n + 1))))
            c.append(_indent(_indent("%s[_key%d] = _value%d;" % (field_name, level_n, level_n))))
            c.append(_indent("}"))
            c.append("}")

        elif type_class == TypeClass.string:
            c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
            c.append("_size += sizeof(messgen::size_type);")
            c.append("%s = {reinterpret_cast<const char *>(&_buf[_size]), _field_size};" % field_name)
            c.append("_size += _field_size;")

        elif type_class == TypeClass.bytes:
            c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
            c.append("_size += sizeof(messgen::size_type);")
            c.append("%s.assign(&_buf[_size], &_buf[_size + _field_size]);" % field_name)
            c.append("_size += _field_size;")

        else:
            raise RuntimeError("Unsupported type_class in _deserialize_field: %s" % type_class)

        c.append("")

        return c

    def _serialized_size_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def.type_class

        c.append("// %s" % field_name)
        if type_class == TypeClass.scalar:
            size = field_type_def.size
            c.append("_size += %d;" % size)

        elif type_class == TypeClass.struct:
            c.append("_size += %s.serialized_size();" % field_name)

        elif type_class in [TypeClass.array, TypeClass.vector]:
            if field_type_def.type_class == TypeClass.vector:
                c.append("_size += sizeof(messgen::size_type);")
            el_type = self._types.get(field_type_def.element_type)
            el_size = el_type.size
            if el_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (el_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d" % level_n, el_type, level_n + 1)))
                c.append("}")

        elif type_class == TypeClass.map:
            c.append("_size += sizeof(messgen::size_type);")
            key_type = self._types.get(field_type_def.key_type)
            value_type = self._types.get(field_type_def.value_type)
            key_size = key_type.size
            value_size = value_type.size
            if key_size is not None and value_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (key_size + value_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d.first" % level_n, key_type, level_n + 1)))
                c.extend(_indent(self._serialized_size_field("_i%d.second" % level_n, value_type, level_n + 1)))
                c.append("}")

        elif type_class in [TypeClass.string, TypeClass.bytes]:
            c.append("_size += sizeof(messgen::size_type);")
            c.append("_size += %s.size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialized_size_field: %s" % field_type_def.type_class)

        return c

    def _memcpy_to_buf(self, src: str, size) -> list:
        return [
            "::memcpy(&_buf[_size], reinterpret_cast<const uint8_t *>(%s), %s);" % (src, size),
            "_size += %s;" % size
        ]

    def _memcpy_from_buf(self, dst: str, size) -> list:
        return [
            "::memcpy(reinterpret_cast<uint8_t *>(%s), &_buf[_size], %s);" % (dst, size),
            "_size += %s;" % size
        ]
