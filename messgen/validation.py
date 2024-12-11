from typing import Any

from .model import (
    EnumType,
    MessgenType,
    Protocol,
    StructType,
)

_CPP_KEYWORDS = {
    "alignas",
    "alignof",
    "and_eq",
    "and",
    "asm",
    "atomic_cancel",
    "atomic_commit",
    "atomic_noexcept",
    "auto",
    "bitand",
    "bitor",
    "bool",
    "break",
    "case",
    "catch",
    "char",
    "char16_t",
    "char32_t",
    "char8_t",
    "class",
    "co_await",
    "co_return",
    "co_yield",
    "compl",
    "concept",
    "const_cast",
    "const",
    "consteval",
    "constexpr",
    "constinit",
    "continue",
    "decltype",
    "default",
    "delete",
    "do",
    "double",
    "dynamic_cast",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "float",
    "for",
    "friend",
    "goto",
    "if",
    "import",
    "inline",
    "int",
    "long",
    "module",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not_eq",
    "not",
    "nullptr",
    "operator",
    "or_eq",
    "or",
    "private",
    "protected",
    "public",
    "reflexpr",
    "register",
    "reinterpret_cast",
    "requires",
    "return",
    "short",
    "signed",
    "sizeof",
    "static_assert",
    "static_cast",
    "static",
    "struct",
    "switch",
    "synchronized",
    "template",
    "this",
    "thread_local",
    "throw",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "unsigned",
    "using",
    "virtual",
    "void",
    "volatile",
    "wchar_t",
    "while",
    "xor_eq",
    "xor",
}

_CPP_INT_TYPES = {
    "int8_t",
    "int16_t",
    "int32_t",
    "int64_t",
    "uint8_t",
    "uint16_t",
    "uint32_t",
    "uint64_t",
}


def validate_protocol(protocol: Protocol, types: dict[str, MessgenType]):
    for type_name in protocol.types.values():
        if type_name not in types:
            raise RuntimeError(f"Type {type_name} required by {protocol.name} protocol not found")


def validate_types(types: dict[str, MessgenType]):
    seen_hashes: dict[int, Any] = {}
    for type_name, type_def in types.items():
        type_hash = hash(type_def)
        if hash_conflict := seen_hashes.get(type_hash):
            raise RuntimeError(f"Type {type_name} has the same hash as {hash_conflict.type}")
        seen_hashes[type_hash] = type_def


# Checks if `s` is a valid name for a field or a message type
def is_valid_name(name: str):
    if not isinstance(name, str) or not name:
        return False

    if not (name[0].isalpha() or name[0] == '_'):
        return False

    if not all(c.isalnum() or c == '_' for c in name[1:]):
        return False

    if name in _CPP_KEYWORDS:
        return False

    if name in _CPP_INT_TYPES:
        return False

    return True


def validate_type_dict(item_name: str, item: dict[str, StructType | EnumType]) -> None:
    if not is_valid_name(item_name):
        raise RuntimeError("Invalid message name %s" % item_name)

    if "type_class" not in item:
        raise RuntimeError("type_class missing in '%s': %s" % (item_name, item))

    if (type_class := item.get("type_class")) not in ["struct", "enum"]:
        raise RuntimeError("type_class '%s' in '%s' is not supported %s" % (type_class, item_name, item))
