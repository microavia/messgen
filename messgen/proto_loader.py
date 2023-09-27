import os
import yaml

# Protocols map structure:
# {
#   proto_name: {
#     proto_id: <proto_id>   // optional
#     types: {
#       <type_name>: <type_definition>,
#       ...
#     }
#     messages: {
#       <msg_id>: <type_name>,
#     }
#   }
# }
#
# Type definition structure:
# {
#   type_class: <class>,   // scalar, enum, array, dynamic, struct, external, alias
#   size: <size>,          // optional, only for fixed-size types
#   comment: <comment>,    // optional
#   // type-dependent fields:
#   // - enum
#   base_type: <base_type>,   // scalar integer type, e.g. uint8, uint32
#   values: {
#     <item_0>: {
#       value: <value_0>,
#       comment: <comment_0>,   // optional
#     },
#     <item_1>: {
#       value: <value_1>,
#       comment: <comment_1>,   // optional
#     },
#     ...
#   }
# }

CONFIG_EXT = ".yaml"
PROTOCOL_ITEM = "_protocol"


def load_protocols(base_dirs: list[str], proto_list: list[str]) -> list[dict]:
    proto_map = {}

    for proto_name in proto_list:
        loaded = False
        for base_dir in base_dirs:
            proto_path = base_dir + os.path.sep + proto_name

            if os.path.exists(proto_path):
                print("Loading protocol: %s from %s" % (proto_name, base_dir))
                proto_map[proto_name] = load_protocol(proto_path)
                loaded = True
        if not loaded:
            print("Protocol %s not found in base directories (%s)" % (proto_name, base_dirs))

    return proto_map


def load_protocol(proto_path: str) -> dict:
    proto = {
        "proto_id": None,
        "types": {},
        "messages": {},
    }
    for fn in os.listdir(proto_path):
        file_path = proto_path + os.path.sep + fn

        if not (os.path.isfile(file_path) and fn.endswith(CONFIG_EXT)):
            continue

        item_name = fn.replace(CONFIG_EXT, "")
        print("  - %s" % item_name)

        with open(file_path, "r") as f:
            item = yaml.safe_load(f)
            if item_name == PROTOCOL_ITEM:
                if "proto_id" in item:
                    proto["proto_id"] = item["proto_id"]
            else:
                proto["types"][item_name] = item
    return proto
