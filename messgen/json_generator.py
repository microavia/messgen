import json

from dataclasses import asdict
from pathlib import Path

from .common import write_file_if_diff
from .protocol_version import version_hash

from .validation import validate_protocol

from .model import (
    MessgenType,
    Protocol,
    TypeClass,
)

class JsonGenerator:
    _FILE_EXT = ".json"

    def __init__(self, options):
        self._options = options

    def generate(self, out_dir: Path, types: dict[str, MessgenType], protocols: dict[str, Protocol]) -> None:
        self.validate(types, protocols)
        self.generate_types(out_dir, types)
        self.generate_protocols(out_dir, protocols)

    def validate(self, types: dict[str, MessgenType], protocols: dict[str, Protocol]):
        for proto_def in protocols.values():
            validate_protocol(proto_def, types)

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
