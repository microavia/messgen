from dataclasses import dataclass
from enum import Enum, auto
from typing import Union


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


@dataclass
class ArrayType:
    type: str
    type_class: TypeClass
    element_type: str
    array_size: int
    size: int | None


@dataclass
class VectorType:
    type: str
    type_class: TypeClass
    element_type: str
    size: None


@dataclass
class MapType:
    type: str
    type_class: TypeClass
    key_type: str
    value_type: str
    size: None


@dataclass
class EnumValue:
    name: str
    value: int
    comment: str


@dataclass
class EnumType:
    type: str
    type_class: TypeClass
    base_type: str
    comment: str
    values: dict[str, EnumValue]
    size: int


@dataclass
class FieldType:
    name: str
    type: str


@dataclass
class StructType:
    type: str
    type_class: TypeClass
    comment: str
    fields: list[FieldType]
    size: int


MessgenType = Union[StructType, BasicType, ArrayType, VectorType, MapType]


@dataclass
class Protocol:
    name: str
    proto_id: int
    types: dict[int, MessgenType]
