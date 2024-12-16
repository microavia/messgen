import struct

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


class TypeSerializer(ABC):

    def __init__(self, types: dict[str, MessgenType], type_name: str):
        self._type_name = type_name
        self._type_def = types[type_name]
        self._type_class = self._type_def.type_class

    def type_name(self) -> str:
        return self._type_name

    def type_hash(self) -> int:
        return hash(self._type_def)

    def serialize(self, data) -> bytes:
        return self._serialize(data)

    def deserialize(self, data) -> dict:
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


class ScalarSerializer(TypeSerializer):
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


class EnumSerializer(TypeSerializer):
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


class StructSerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.struct
        assert isinstance(self._type_def, StructType)
        self.fields = [(field.name, create_type_serializer(types, field.type))
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


class ArraySerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.array
        assert isinstance(self._type_def, ArrayType)
        self.element_type = create_type_serializer(types, self._type_def.element_type)
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


class VectorSerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.vector
        assert isinstance(self._type_def, VectorType)
        self.size_type = create_type_serializer(types, "uint32")
        self.element_type = create_type_serializer(types, self._type_def.element_type)

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


class MapSerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.map
        assert isinstance(self._type_def, MapType)
        self.size_type = create_type_serializer(types, "uint32")
        self.key_type = create_type_serializer(types, self._type_def.key_type)
        self.value_type = create_type_serializer(types, self._type_def.value_type)

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


class StringSerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.string
        self.size_type = create_type_serializer(types, "uint32")
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


class BytesSerializer(TypeSerializer):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.bytes
        self.size_type = create_type_serializer(types, "uint32")
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


def create_type_serializer(types: dict[str, MessgenType], type_name: str) -> TypeSerializer:
    type_def = types[type_name]
    type_class = type_def.type_class
    if type_class == TypeClass.scalar:
        return ScalarSerializer(types, type_name)
    elif type_class == TypeClass.enum:
        return EnumSerializer(types, type_name)
    elif type_class == TypeClass.struct:
        return StructSerializer(types, type_name)
    elif type_class == TypeClass.array:
        return ArraySerializer(types, type_name)
    elif type_class == TypeClass.vector:
        return VectorSerializer(types, type_name)
    elif type_class == TypeClass.map:
        return MapSerializer(types, type_name)
    elif type_class == TypeClass.string:
        return StringSerializer(types, type_name)
    elif type_class == TypeClass.bytes:
        return BytesSerializer(types, type_name)
    raise RuntimeError("Unsupported field type class \"%s\" in %s" % (type_class, type_def.type))


class Codec:

    def __init__(self):
        self.types_by_name = {}
        self.proto_types_by_name = {}
        self.proto_types_by_id = {}

    def get_type_serializer(self, type_name: str) -> TypeSerializer:
        if converter := self.types_by_name.get(type_name):
            return converter
        raise MessgenError(f"Unsupported type_name={type_name}")

    def load(self, type_dirs: list[str | Path], protocols: list[str] | None = None):
        parsed_types = parse_types(type_dirs)
        if not protocols:
            return

        for type_name in parsed_types:
            self.types_by_name[type_name] = create_type_serializer(parsed_types, type_name)

        parsed_protocols = parse_protocols(protocols)
        for proto_name, proto_def in parsed_protocols.items():
            by_name: tuple[int, dict] = (proto_def.proto_id, {})
            by_id: tuple[str, dict] = (proto_name, {})
            for msg_id, message in proto_def.messages.items():
                t = create_type_serializer(parsed_types, message.type)
                by_name[1][type_name] = (msg_id, t)
                if msg_id is not None:
                    by_id[1][msg_id] = (type_name, t)
            self.proto_types_by_name[proto_name] = by_name
            self.proto_types_by_id[proto_def.proto_id] = by_id

    def serialize(self, proto_name: str, type_name: str, msg: dict) -> tuple[int, int, bytes]:
        if not proto_name in self.proto_types_by_name:
            raise MessgenError(f"Unsupported proto_name={proto_name} in serialization")

        proto_id, proto = self.proto_types_by_name[proto_name]
        if not type_name in proto:
            raise MessgenError(f"Unsupported type_name={type_name} in serialization")

        type_id, converter = proto[type_name]
        payload = converter.serialize(msg)
        return proto_id, type_id, payload

    def deserialize(self, proto_id: int, type_id: int, data: bytes) -> tuple[int, str, dict]:
        if not proto_id in self.proto_types_by_id:
            raise MessgenError(f"Unsupported proto_id={proto_id} in deserialization")

        proto_name, proto = self.proto_types_by_id[proto_id]
        if not type_id in proto:
            raise MessgenError(f"Unsupported type_id={type_id} in deserialization")

        type_name, converter = proto[type_id]
        return proto_name, type_name, converter.deserialize(data)
