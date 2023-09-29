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
#   size: <size>,          // optional, only for fixed-size types, serialized size in bytes
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

_SCALAR_TYPES_INFO = {
    "char": {"size": 1},
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

class Protocols:
    proto_map : dict[str, dict] = {}

    def load(self, base_dirs: list[str], proto_list: list[str]):
        for proto_name in proto_list:
            loaded = False
            for base_dir in base_dirs:
                proto_path = base_dir + os.path.sep + proto_name

                if os.path.exists(proto_path):
                    print("Loading protocol: %s from %s" % (proto_name, base_dir))
                    self.proto_map[proto_name] = self._load_protocol(proto_path)
                    loaded = True
            if not loaded:
                print("Protocol %s not found in base directories (%s)" % (proto_name, base_dirs))

    def get_type(self, curr_proto_name, type_name):
        # Scalar
        t = _SCALAR_TYPES_INFO.get(type_name)
        if t:
            return {
                "type_class": "scalar",
                "size": t["size"]
            }

        # Type from current protocol
        t = self.proto_map[curr_proto_name]["types"].get(type_name)
        if t:
            if t["type_class"] == "enum":
                t["size"] = self.get_type(curr_proto_name, type_name)["size"]
            # TODO
            return t

        raise RuntimeError("Type not found: %s, current protocol: %s" % (type_name, curr_proto_name))

    def _load_protocol(self, proto_path: str) -> dict:
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
