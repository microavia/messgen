from . import common
from . import protocol_version
from .protocols import Protocols
import json
import os


class JsonGenerator:
    _protocols: Protocols
    _options: dict

    def __init__(self, protos, options):
        self._protocols = protos
        self._options = options

    def generate(self, out_dir, proto_name, proto):
        proto_out_dir = out_dir + os.path.sep + proto_name.replace(common.SEPARATOR, os.path.sep)

        try:
            os.makedirs(proto_out_dir)
        except:
            pass

        data = proto
        data["version"] = protocol_version.version_hash(proto)

        enc = json.JSONEncoder()
        enc.indent = 2
        self.__write_file(proto_out_dir + os.path.sep + "protocol.json", enc.encode(data))

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            f.write(code)
