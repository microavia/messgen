import struct

from functools import singledispatchmethod
from abc import ABC, abstractmethod
from pathlib import Path

from .model import (
    ArrayType,
    EnumType,
    MapType,
    MessgenType,
    StructType,
    TypeClass,
    VectorType,
)
from .yaml_parser import (
    parse_protocols,
    parse_types
)

STRUCT_TYPES_MAP = {
    "uint8": "B",
    "int8": "b",
    "uint16": "H",
    "int16": "h",
    "uint32": "I",
    "int32": "i",
    "uint64": "Q",
    "int64": "q",
    "float32": "f",
    "float64": "d",
    "bool": "?",
}


class MessgenError(Exception):
    pass


class TypeConverter(ABC):

    def __init__(self, types: dict[str, MessgenType], type_name: str):
        self._type_name = type_name
        self._type_def = types[type_name]
        self._type_class = self._type_def.type_class

    def type_name(self) -> str:
        return self._type_name

    def type_hash(self) -> int:
        return hash(self._type_def)

    def serialize(self, data: dict) -> bytes:
        return self._serialize(data)

    def deserialize(self, data: bytes) -> dict:
        msg, sz = self._deserialize(data)
        if sz != len(data):
            raise MessgenError(
                f"Invalid message size: expected={sz} actual={len(data)} type_name={self._type_name}")
        return msg

    @abstractmethod
    def _serialize(self, data) -> bytes:
        pass

    @abstractmethod
    def _deserialize(self, data) -> tuple[dict, int]:
        pass


class ScalarConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.scalar
        self.struct_fmt = STRUCT_TYPES_MAP.get(type_name)
        if self.struct_fmt is None:
            raise RuntimeError("Unsupported scalar type \"%s\"" % type_name)
        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.def_value: bool | float | int = 0
        if type_name == "bool":
            self.def_value = False
        elif type_name == "float32" or type_name == "float64":
            self.def_value = 0.0

    def _serialize(self, data):
        return struct.pack(self.struct_fmt, data)

    def _deserialize(self, data):
        return struct.unpack(self.struct_fmt, data[:self.size])[0], self.size

    def default_value(self):
        return self.def_value


class EnumConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.enum
        assert isinstance(self._type_def, EnumType)
        self.base_type = self._type_def.base_type
        self.struct_fmt = STRUCT_TYPES_MAP.get(self.base_type, None)
        if self.struct_fmt is None:
            raise RuntimeError("Unsupported base type \"%s\" in %s" % (self.base_type, type_name))
        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.mapping = {}
        for item in self._type_def.values:
            self.mapping[item.value] = item.name
        self.rev_mapping = {v: k for k, v in self.mapping.items()}

    def _serialize(self, data):
        v = self.rev_mapping[data]
        return struct.pack(self.struct_fmt, v)

    def _deserialize(self, data):
        v, = struct.unpack(self.struct_fmt, data[:self.size])
        return self.mapping[v], self.size

    def default_value(self):
        return self._type_def.values[0].name


class StructConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.struct
        assert isinstance(self._type_def, StructType)
        self.fields = [(field.name, create_type_converter(types, field.type))
                       for field in self._type_def.fields]

    def _serialize(self, data):
        out = []
        for field_name, field_type in self.fields:
            v = data.get(field_name, None)
            if v is None:
                v = field_type.default_value()
            out.append(field_type._serialize(v))
        return b"".join(out)

    def _deserialize(self, data):
        out = {}
        offset = 0
        for field_name, field_type in self.fields:
            value, size = field_type._deserialize(data[offset:])
            out[field_name] = value
            offset += size
        return out, offset

    def default_value(self):
        return {field_name : field_type.default_value()
                for field_name, field_type in self.fields}


class ArrayConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.array
        assert isinstance(self._type_def, ArrayType)
        self.element_type = create_type_converter(types, self._type_def.element_type)
        self.array_size = self._type_def.array_size

    def _serialize(self, data):
        out = []
        assert len(data) == self.array_size
        for item in data:
            out.append(self.element_type._serialize(item))
        return b"".join(out)

    def _deserialize(self, data):
        out = []
        offset = 0
        for i in range(self.array_size):
            value, size = self.element_type._deserialize(data[offset:])
            out.append(value)
            offset += size
        return out, offset

    def default_value(self):
        out = []
        for i in range(self.array_size):
            out.append(self.element_type.default_value())
        return out


class VectorConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.vector
        assert isinstance(self._type_def, VectorType)
        self.size_type = create_type_converter(types, "uint32")
        self.element_type = create_type_converter(types, self._type_def.element_type)

    def _serialize(self, data):
        out = []
        out.append(self.size_type._serialize(len(data)))

        for item in data:
            out.append(self.element_type._serialize(item))
        return b"".join(out)

    def _deserialize(self, data):
        out = []
        offset = 0
        n, n_size = self.size_type._deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            value, n = self.element_type._deserialize(data[offset:])
            out.append(value)
            offset += n
        return out, offset

    def default_value(self):
        return []


class MapConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.map
        assert isinstance(self._type_def, MapType)
        self.size_type = create_type_converter(types, "uint32")
        self.key_type = create_type_converter(types, self._type_def.key_type)
        self.value_type = create_type_converter(types, self._type_def.value_type)

    def _serialize(self, data):
        out = []
        out.append(self.size_type._serialize(len(data)))
        for k, v in data.items():
            out.append(self.key_type._serialize(k))
            out.append(self.value_type._serialize(v))
        return b"".join(out)

    def _deserialize(self, data):
        out = {}
        offset = 0
        n, n_size = self.size_type._deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            key, n = self.key_type._deserialize(data[offset:])
            offset += n
            value, n = self.value_type._deserialize(data[offset:])
            offset += n
            out[key] = value
        return out, offset

    def default_value(self):
        return {}


class StringConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.string
        self.size_type = create_type_converter(types, "uint32")
        self.struct_fmt = "<%is"

    def _serialize(self, data):
        return self.size_type._serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data.encode("utf-8"))

    def _deserialize(self, data):
        n, n_size = self.size_type._deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset:offset + n])[0]
        offset += n
        return value.decode("utf-8"), offset

    def default_value(self):
        return ""


class BytesConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.bytes
        self.size_type = create_type_converter(types, "uint32")
        self.struct_fmt = "<%is"

    def _serialize(self, data):
        return self.size_type._serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data)

    def _deserialize(self, data):
        n, n_size = self.size_type._deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset:offset + n])[0]
        offset += n
        return value, offset

    def default_value(self):
        return b""


def create_type_converter(types: dict[str, MessgenType], type_name: str) -> TypeConverter:
    type_def = types[type_name]
    type_class = type_def.type_class
    if type_class == TypeClass.scalar:
        return ScalarConverter(types, type_name)
    elif type_class == TypeClass.enum:
        return EnumConverter(types, type_name)
    elif type_class == TypeClass.struct:
        return StructConverter(types, type_name)
    elif type_class == TypeClass.array:
        return ArrayConverter(types, type_name)
    elif type_class == TypeClass.vector:
        return VectorConverter(types, type_name)
    elif type_class == TypeClass.map:
        return MapConverter(types, type_name)
    elif type_class == TypeClass.string:
        return StringConverter(types, type_name)
    elif type_class == TypeClass.bytes:
        return BytesConverter(types, type_name)
    raise RuntimeError("Unsupported field type class \"%s\" in %s" % (type_class, type_def.type))


class MessageInfo:

    def __init__(self, proto_id: int, message_id: int, proto_name: str, message_name: str, type_converter: TypeConverter):
        self._proto_id = proto_id
        self._message_id = message_id
        self._proto_name = proto_name
        self._message_name = message_name
        self._type_converter = type_converter

    def proto_name(self) -> str:
        return self._proto_name

    def message_name(self) -> str:
        return self._message_name

    def proto_id(self) -> int:
        return self._proto_id

    def message_id(self) -> int:
        return self._message_id

    def type_name(self) -> str:
        return self._type_converter.type_name()

    def type_hash(self) -> int:
        return self._type_converter.type_hash()

    def type_converter(self) -> TypeConverter:
        return self._type_converter


class Codec:

    def __init__(self) -> None:
        self._converters_by_name: dict[str, TypeConverter] = {}
        self._id_by_name: dict[tuple[str, str], tuple[int, int, str]] = {}
        self._name_by_id: dict[tuple[int, int], tuple[str, str, str]] = {}

    def load(self, type_dirs: list[str | Path], protocols: list[str] | None = None):
        parsed_types = parse_types(type_dirs)
        if not protocols:
            return

        for type_name in parsed_types:
            self._converters_by_name[type_name] = create_type_converter(parsed_types, type_name)

        parsed_protocols = parse_protocols(protocols)
        for proto_name, proto_def in parsed_protocols.items():
            for msg_id, message in proto_def.messages.items():
                self._id_by_name[(proto_name, message.name)] = (proto_def.proto_id, msg_id, message.type)
                self._name_by_id[(proto_def.proto_id, msg_id)] = (proto_name, message.name, message.type)

    def type_converter(self, type_name: str) -> TypeConverter:
        if converter := self._converters_by_name.get(type_name):
            return converter
        raise MessgenError(f"Unsupported type_name={type_name}")

    def message_info_by_id(self, proto_id: int, message_id: int) -> MessageInfo:
        key = (proto_id, message_id)
        if not key in self._name_by_id:
            raise MessgenError(f"Unsupported proto_id={proto_id} message_id={message_id}")

        proto_name, message_name, type_name = self._name_by_id[key]
        return MessageInfo(proto_id, message_id, proto_name, message_name, self._converters_by_name[type_name])

    def message_info_by_name(self, proto_name: str, message_name: str) -> MessageInfo:
        key = (proto_name, message_name)
        if not key in self._id_by_name:
            raise MessgenError(f"Unsupported proto_name={proto_name} message_name={message_name}")

        proto_id, message_id, type_name = self._id_by_name[key]
        return MessageInfo(proto_id, message_id, proto_name, message_name, self._converters_by_name[type_name])
