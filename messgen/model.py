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
class EnumType:
    type: str
    type_class: str
    base_type: str
    values: dict[str, Union[int, str]]
    size: int


FieldType = Union[BasicType, ArrayType, VectorType, MapType]


@dataclass
class StructType:
    type: str
    type_class: str
    fields: list[tuple[str, FieldType]]
    size: int


MessgenType = Union[StructType, BasicType, ArrayType, VectorType, MapType]
