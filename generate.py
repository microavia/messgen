#!/usr/bin/env python3

import argparse

import os
from messgen.go_generator import GoGenerator
from messgen.json_generator import JsonGenerator
from messgen.parser import load_modules
from messgen.cpp_generator import CppGenerator
from messgen.data_types_preprocessor import DataTypesPreprocessor
from messgen import MessgenException

MODULE_SEP = "/"

generators = {
    "c": CppGenerator,
    "go": GoGenerator,
    "json": JsonGenerator,
}

PLAIN_TYPES = {
    "char": {"size": 1, "align": 1},
    "int8": {"size": 1, "align": 1},
    "uint8": {"size": 1, "align": 1},
    "int16": {"size": 2, "align": 2},
    "uint16": {"size": 2, "align": 2},
    "int32": {"size": 4, "align": 4},
    "uint32": {"size": 4, "align": 4},
    "int64": {"size": 8, "align": 8},
    "uint64": {"size": 8, "align": 8},
    "float32": {"size": 4, "align": 4},
    "float64": {"size": 8, "align": 8},
}

ALIAS_TYPES = {
    "string": "char[]",
    "bytes": "uint8[]",
}


def __get_free_id_list(module, free_ids_cnt):
    module_msg_ids = []
    for msg in module["messages"]:
        module_msg_ids.append(msg["id"])

    module_msg_ids.sort()

    free_ids = []
    last_id = 0
    for id in module_msg_ids:
        if id - last_id > 0:
            free_ids.extend(range(last_id+1, id))

        last_id = id

    if len(free_ids) < free_ids_cnt:
        d = free_ids_cnt - len(free_ids)
        free_ids.extend(range(module_msg_ids[-1] + 1, module_msg_ids[-1] + d + 1))
    else:
        free_ids = free_ids[:free_ids_cnt]

    return free_ids


def __dump_datatypes(modules_map, datatypes_map, free_ids_cnt=10):
    dump = ""

    for module_name, module_obj in modules_map.items():
        free_ids = __get_free_id_list(module_obj, free_ids_cnt)
        dump += ("%s free ids list: %s" % (module_name, str(free_ids))) + os.linesep

    dump += os.linesep

    for typename, datatype in datatypes_map.items():
        dump += "****************" + os.linesep
        dump += typename + os.linesep

        if datatype["plain"]:
            continue

        for field in datatype["fields"]:
            dump += "\t\t" + field["type"] + " " + field["name"] + ": "
            if field["is_array"]:
                if field["is_dynamic"]:
                    dump += "[]"
                else:
                    dump += ("[%d]" % field["num"])

            dump += os.linesep

        # type_info = message["type_info"]
        dump += "\t\tAlignment: " + str(datatype["align"]) + os.linesep
        dump += "\t\tStatic size: " + str(datatype["static_size"]) + os.linesep

        dump += "\t\tDepends:" + os.linesep
        for dep in datatype["deps"]:
            dump += ("\t\t\t" + dep) + os.linesep

        dump += os.linesep + os.linesep

    return dump


def main():
    parser = argparse.ArgumentParser(description='Message generator.')
    parser.add_argument("-b", "--basedirs", required=True, type=str, nargs="+",
                        help='Message definition base directories')
    parser.add_argument("-m", "--modules", required=True, type=str, nargs="+", help='Modules')
    parser.add_argument("-o", "--outdir", type=str, help='Output directory', default=".")
    parser.add_argument("-l", "--lang", required=True, type=str,
                        help='Output language (c=C++, go=Golang, js=JavaScript)')
    parser.add_argument("-D", "--define", action='append', help="Define variables in 'key=value' format")

    args = parser.parse_args()

    try:
        # Parse variables
        variables = {}
        if args.define:
            for v in args.define:
                p = v.split("=")
                if len(p) != 2:
                    raise Exception("Invalid argument in -D option, must be 'key=value'")
                variables[p[0]] = p[1]

        modules_map = load_modules(args.basedirs, args.modules)

        data_types_preprocessor = DataTypesPreprocessor(PLAIN_TYPES, ALIAS_TYPES)
        data_types_map = data_types_preprocessor.create_types_map(modules_map)
        with open("dump.txt", "w+") as f:
            f.write(__dump_datatypes(modules_map, data_types_map))

        g_type = generators.get(args.lang)
        if g_type is None:
            raise Exception("Unsupported language " + args.lang)

        g = g_type(modules_map, data_types_map, MODULE_SEP, variables)
        g.generate(args.outdir)
    except MessgenException as e:
        print(e)
        exit(-1)


if __name__ == "__main__":
    main()
