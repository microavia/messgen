import json
import os

from dataclasses import asdict
from pathlib import Path

from .common import write_file_if_diff
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
            write_file_if_diff(file_name, json.dumps(asdict(type_def), indent=2).splitlines())

    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        for proto_name, proto_def in protocols.items():
            file_name = out_dir / (proto_name + self._FILE_EXT)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            proto_dict = asdict(proto_def)
            proto_dict["version"] = version_hash(proto_dict)
            write_file_if_diff(file_name, json.dumps(asdict(proto_def), indent=2).splitlines())
