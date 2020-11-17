import os

import yaml

from .messgen_ex import MessgenException

CONFIG_EXT = ".yaml"
PROTOCOL_FILE = "_protocol" + CONFIG_EXT
CONSTANTS_FILE = "_constants" + CONFIG_EXT


def load_modules(basedirs, modules):
    modules_map = {}
    proto_id = None

    for module_name in modules:
        module_messages = []
        module_constants = []
        for basedir in basedirs:
            module_path = basedir + os.path.sep + module_name

            if os.path.exists(module_path):
                for item in os.listdir(module_path):
                    msg_file_path = module_path + os.path.sep + item

                    if not (os.path.isfile(msg_file_path) and item.endswith(CONFIG_EXT)):
                        continue

                    msg_name = item.replace(CONFIG_EXT, "")

                    with open(msg_file_path, "r") as f:
                        msg = yaml.load(f)

                        if item == PROTOCOL_FILE:
                            if msg.get("proto_id") is None:
                                raise MessgenException("Missing proto id field")

                            proto_id = msg["proto_id"]

                            for existing_mod_name, existing_mod in modules_map.items():
                                if existing_mod["proto_id"] == proto_id:
                                    raise MessgenException(
                                        "Duplicate proto_id=%s in modules '%s' and '%s'" %
                                        (proto_id, module_name, existing_mod_name))

                            continue

                        if item == CONSTANTS_FILE:
                            if msg is not None:
                                module_constants = msg

                            continue

                        if (msg is None) or (msg.get("id") is None):
                            raise MessgenException("Wrong message file format in %s" % msg_file_path)

                        msg["name"] = msg_name

                        for m in module_messages:
                            if m["id"] == msg["id"]:
                                raise MessgenException(
                                    "Duplicate ID=%s for messages '%s' and '%s' in module %s"
                                    % (m["id"], m["name"], msg["name"], module_name))
                        module_messages.append(msg)

        modules_map[module_name] = {
            "proto_id": proto_id,
            "constants": module_constants,
            "messages": list(
                sorted(module_messages,
                       key=lambda msg: msg["id"])
            )
        }

    return modules_map
