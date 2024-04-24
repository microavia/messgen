# Checks if `s` is a valid name for a field or a message type
def is_valid_name(s):
    if not isinstance(s, str) or not s:
        return False
    if not (s[0].isalpha() or s[0] == '_'):
        return False
    if not all(c.isalnum() or c == '_' for c in s[1:]):
        return False

    cpp_keywords = {
        "alignas", "alignof", "and", "and_eq", "asm", "atomic_cancel", "atomic_commit", "atomic_noexcept",
        "auto", "bitand", "bitor", "bool", "break", "case", "catch", "char", "char8_t", "char16_t", "char32_t",
        "class", "compl", "concept", "const", "consteval", "constexpr", "constinit", "const_cast", "continue",
        "co_await", "co_return", "co_yield", "decltype", "default", "delete", "do", "double", "dynamic_cast",
        "else", "enum", "explicit", "export", "extern", "false", "float", "for", "friend", "goto", "if", "inline",
        "int", "long", "mutable", "namespace", "new", "noexcept", "not", "not_eq", "nullptr", "operator", "or",
        "or_eq", "private", "protected", "public", "reflexpr", "register", "reinterpret_cast", "requires", "return",
        "short", "signed", "sizeof", "static", "static_assert", "static_cast", "struct", "switch", "synchronized",
        "template", "this", "thread_local", "throw", "true", "try", "typedef", "typeid", "typename", "union",
        "unsigned", "using", "virtual", "void", "volatile", "wchar_t", "while", "xor", "xor_eq"
    }
    if s in cpp_keywords:
        return False

    cpp_int_types = {"int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t", "uint32_t", "uint64_t"}
    if s in cpp_int_types:
        return False

    return True

def validate_yaml_item(item_name, item):
    if not is_valid_name(item_name):
        raise RuntimeError("Invalid message name %s" % item_name)
    if "type_class" not in item:
        raise RuntimeError("type_class missing in '%s': %s" % (item_name, item))
    type_class = item.get("type_class", "")
    if type_class not in ["struct", "enum", "variant"]:
        raise RuntimeError("type_class '%s' in '%s' is not supported %s" % (type_class, item_name, item))

