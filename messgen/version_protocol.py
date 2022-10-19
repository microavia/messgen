import hashlib


class VersionProtocol:
    def __init__(self, modules_map):
        self._modules_map = modules_map


    def generate(self):
        result = hashlib.md5(str(self._modules_map).encode())

        return result.hexdigest()[0:6]
