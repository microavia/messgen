import hashlib


class VersionProtocol:
    def __init__(self, module):
        self._module = module


    def generate(self):
        result = hashlib.md5(str(self._module).encode())

        return result.hexdigest()[0:6]
