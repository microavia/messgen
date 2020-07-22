import re


def __get_types_map_pattern(types_map):
    pattern = "("
    for _type in types_map:
        pattern += _type + "|"

    return pattern[:-1] + ")"


def remove_array(typename):
    return re.sub("(\[\d*\])$", "", typename)


def is_dynamic(typename):
    se = re.search("(\[\])$", typename)
    return se is not None


def in_types_map(types_map, typename):
    pattern = __get_types_map_pattern(types_map)
    typename = remove_array(typename)

    return re.search(pattern, typename) is not None


def get_module_name(norm_typename):
    return ""


def is_array(typename):
    se = re.search("(\[\d*\])$", typename)
    return se is not None


def get_array_size(array):
    size_pattern = "\d+\]$"

    matches = re.search(size_pattern, array)
    if matches is not None:
        return matches.group(0).replace("]", "")

    return 0


def get_type_size_from_array(types_map, array):
    type_pattern = ""

    for k in types_map:
        type_pattern += "(" + k + ")" + "|"

    type_pattern = type_pattern[:-1]

    matches = re.search(type_pattern, array)
    _type = matches.group(0)

    size_pattern = "\d+\]$"

    matches = re.search(size_pattern, array)
    _size = matches.group(0).replace("]", "")

    return _type, _size


def get_field_type(field_type):
    return remove_array(field_type)


if __name__ == "__main__":
    assert (remove_array("ololo[10]") == "ololo")
    assert (remove_array("int8[11]") == "int8")
    assert (remove_array("ahah") == "ahah")
    assert (remove_array("uint8") == "uint8")

    TYPE_MAP = {
        "char": {"size": 1, "align": 1},
        "int8": {"size": 1, "align": 1},
        "uint8": {"size": 1, "align": 1},
        "int16": {"size": 2, "align": 2},
        "uint16": {"size": 2, "align": 2},
        "int32": {"size": 4, "align": 4},
        "uint32": {"size": 4, "align": 4},
        "int64": {"size": 8, "align": 8},
        "uint64": {"size": 8, "align": 8},
        "float32": {"size": 4, "align": 8},
        "float64": {"size": 8, "align": 8},
        "microavia/mess1": {},
        "microavia/batmon/mess1": {},
    }

    assert (in_types_map(TYPE_MAP, "char"))
    assert (in_types_map(TYPE_MAP, "int8"))
    assert (in_types_map(TYPE_MAP, "float64[10]"))
    assert (in_types_map(TYPE_MAP, "uint64[20]"))
    assert (in_types_map(TYPE_MAP, "microavia/mess1"))
    assert (in_types_map(TYPE_MAP, "microavia/batmon/mess1"))
    assert (in_types_map(TYPE_MAP, "microavia/mess1[10]"))
    assert (in_types_map(TYPE_MAP, "microavia/batmon/mess1[2]"))
    assert (not in_types_map(TYPE_MAP, "microavia/batmon/mess2"))
    assert (not in_types_map(TYPE_MAP, "microavia/"))
    assert (not in_types_map(TYPE_MAP, "microavia/random_msg[10]"))
    assert (get_array_size("uint32[10]") == "10")
    assert (get_array_size("uint8[12]") == "12")
