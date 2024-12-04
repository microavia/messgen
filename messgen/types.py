import os
import yaml
import traceback

from dataclasses import dataclass
from pathlib import Path
from typing import Union, Any

from .common import SEPARATOR
from .validation import is_valid_name, validate_yaml_item


_CONFIG_EXT = ".yaml"
_SCALAR_TYPES_INFO = {
    "bool": {"size": 1},
    "int8": {"size": 1},
    "uint8": {"size": 1},
    "int16": {"size": 2},
    "uint16": {"size": 2},
    "int32": {"size": 4},
    "uint32": {"size": 4},
    "int64": {"size": 8},
    "uint64": {"size": 8},
    "float32": {"size": 4},
    "float64": {"size": 8},
}


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


def parse_types(base_dirs: list[str]) -> dict[str, Union[BasicType, ArrayType, VectorType, MapType]]:
    type_descriptors = {}
    for directory in base_dirs:
        base_dir = Path.cwd() / directory
        type_files = base_dir.rglob(f'*{_CONFIG_EXT}')
        for type_file in type_files:
            with open(type_file, "r") as f:
                item = yaml.safe_load(f)
                validate_yaml_item(type_file.stem, item)
                type_descriptors[_type_name(type_file, base_dir)] = item

    return {
        type_name: _get_type(type_name, type_descriptors)
        for type_name in type_descriptors
    }


def _type_name(type_file: Path, base_dir: Path) -> str:
    return type_file.relative_to(base_dir).with_suffix("").as_posix().replace(os.sep, SEPARATOR)


def _get_type(type_name: str, type_descriptors: dict[str, dict[str, Any]]) -> MessgenType:
    # Scalar
    if scalar_type := _SCALAR_TYPES_INFO.get(type_name):
        return BasicType(type=type_name,
                         type_class="scalar",
                         size=scalar_type["size"])

    if len(type_name) > 2:
        # Vector
        if type_name.endswith("[]"):
            return VectorType(type=type_name,
                              type_class="vector",
                              element_type=type_name[:-2],
                              size=None)

        # Array
        if type_name.endswith("]"):
            p = type_name[:-1].split("[")
            el_type = "[".join(p[:-1])
            array_size = int(p[-1])
            if array_size > 0x10000:
                print("Warn: %s array size is too large and may cause SIGSEGV on init" % type_name)
            res = ArrayType(type=type_name,
                            type_class="array",
                            element_type=el_type,
                            array_size=array_size,
                            size=None)
            el_type_def = _get_type(el_type, type_descriptors)
            sz = el_type_def.size
            if sz is not None:
                res.size = sz * array_size
            return res

        # Map
        if type_name.endswith("}"):
            p = type_name[:-1].split("{")
            value_type = "{".join(p[:-1])
            key_type = p[-1]
            return MapType(type=type_name,
                           type_class="map",
                           key_type=key_type,
                           value_type=value_type,
                           size=None)

    if type_name in ["string", "bytes"]:
        return BasicType(type=type_name,
                         type_class=type_name,
                         size=None)

    type_desc = type_descriptors.get(type_name)
    if not type_desc:
        raise RuntimeError(f"Invalid type: {type_name}")

    type_class = type_desc.get("type_class", None)
    if type_class == "enum":
        dependency = _get_type(type_desc.get("base_type"), type_descriptors)
        return EnumType(type=type_name,
                        type_class="enum",
                        base_type=type_desc.get("base_type", None),
                        values=type_desc.get("values", {}),
                        size=dependency.size)

    if type_class == "struct":
        struct_type = StructType(type=type_name,
                                 type_class="struct",
                                 fields=[],
                                 size=None)

        fields = (type_desc.get("fields")
                  if isinstance(type_desc.get("fields"), list)
                  else [])

        sz = 0
        fixed_size = True
        seen_names = set()
        for field in fields:
            field_name = field.get("name")

            if not is_valid_name(field_name):
                raise RuntimeError(f"Invalid field '{field_name}' in {type_class}")

            if field_name in seen_names:
                raise RuntimeError(f"Duplicate field name '{field_name}' in {type_class}")

            seen_names.add(field_name)

            absolute_dep_name = field.get("type")
            relative_dep_name = str(Path(type_name).parent / field.get("type"))

            dependency = (_value_or_none(_get_type, absolute_dep_name, type_descriptors) or
                          _value_or_none(_get_type, relative_dep_name, type_descriptors))
            if not dependency:
                raise RuntimeError(f"Invalid field '{type_name}.{field_name}' in {type_class}. "
                                   f"Could not resolve type from {absolute_dep_name} or {relative_dep_name}")

            if (dsz := dependency.size) is not None:
                sz += dsz
            else:
                fixed_size = False

        if fixed_size:
            struct_type.size = sz

        return struct_type

    raise RuntimeError("Invalid type class: %s" % type_class)


def _value_or_none(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as ex:
        print(traceback.format_exc())
        return None
