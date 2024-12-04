from dataclasses import dataclass
from typing import Union


@dataclass
class BasicType:
    type: str
    type_class: str
    size: int


@dataclass
class ArrayType:
    type: str
    type_class: str
    element_type: str
    array_size: int
    size: int


@dataclass
class VectorType:
    type: str
    type_class: str
    element_type: str
    size: int


@dataclass
class MapType:
    type: str
    type_class: str
    key_type: str
    value_type: str
    size: int


@dataclass
class EnumValue:
    name: str
    value: int
    comment: str


@dataclass
class EnumType:
    type: str
    type_class: str
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
    type_class: str
    comment: str
    fields: list[FieldType]
    size: int


MessgenType = Union[StructType, BasicType, ArrayType, VectorType, MapType]


@dataclass
class Protocol:
    name: str
    proto_id: int
    types: dict[int, MessgenType]
