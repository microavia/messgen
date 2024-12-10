import json

from dataclasses import asdict
from pathlib import Path

from .protocol_version import version_hash

from .model import (
    MessgenType,
    Protocol,
    TypeClass,
)

class JsonGenerator:
    _FILE_EXT = ".json"

    def __init__(self, options):
        self._options = options

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        for type_name, type_def in types.items():
            if type_def.type_class not in [TypeClass.struct, TypeClass.enum]:
                continue
            file_name = out_dir / (type_name + self._FILE_EXT)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            type_dict = asdict(type_def)
            type_dict["hash"] = hash(type_def)
            write_file_if_diff(file_name, json.dumps(type_dict, indent=2).splitlines())

    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        combined: list = []

        for proto_def in protocols.values():
            proto_dict = asdict(proto_def)
            proto_dict["hash"] = hash(proto_def)
            write_file_if_diff(file_name, json.dumps(proto_dict, indent=2).splitlines())
