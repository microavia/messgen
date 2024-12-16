import hashlib
import json

from dataclasses import dataclass, asdict
from enum import Enum, auto
from typing import Union


def _hash_model_type(dt) -> int:
    input_string = json.dumps(asdict(dt)).replace(" ", "")
    hash_object = hashlib.md5(input_string.encode())
    hex_digest = hash_object.hexdigest()
    hash_32_bits = int(hex_digest[:8], 16)
    return hash_32_bits


class TypeClass(str, Enum):
    scalar = auto()
    string = auto()
    bytes = auto()
    vector = auto()
    array = auto()
    map = auto()
    enum = auto()
    struct = auto()


@dataclass
class BasicType:
    type: str
    type_class: TypeClass
    size: int | None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class ArrayType:
    type: str
    type_class: TypeClass
    element_type: str
    array_size: int
    size: int | None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class VectorType:
    type: str
    type_class: TypeClass
    element_type: str
    size: None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class MapType:
    type: str
    type_class: TypeClass
    key_type: str
    value_type: str
    size: None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class EnumValue:
    name: str
    value: int
    comment: str

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class EnumType:
    type: str
    type_class: TypeClass
    base_type: str
    comment: str | None
    values: list[EnumValue]
    size: int

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class FieldType:
    name: str
    type: str
    comment: str | None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class StructType:
    type: str
    type_class: TypeClass
    comment: str | None
    fields: list[FieldType]
    size: int | None

    def __hash__(self):
        return _hash_model_type(self)


MessgenType = Union[
    ArrayType,
    BasicType,
    EnumType,
    MapType,
    StructType,
    VectorType,
]


@dataclass
class Message:
    message_id: int
    name: str
    type: str
    comment: str | None

    def __hash__(self):
        return _hash_model_type(self)


@dataclass
class Protocol:
    name: str
    proto_id: int
    messages: dict[int, Message]

    def __hash__(self):
        return _hash_model_type(self)
