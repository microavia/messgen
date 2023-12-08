import hashlib
import json

class VersionProtocol:
    def __init__(self, module):
        self._module = module

    # Returns true for key-value pairs that should not affect proto version hash
    def should_discard(self, key, value):
        return (key in ['descr', 'name']) and isinstance(value, str)

    # Recursively sort the dictionary by keys, excluding certain keys, and return its sorted JSON representation.
    def _sorted_purified_dict(self, obj):
        if isinstance(obj, dict):
            return {k: self._sorted_purified_dict(obj[k]) for k in sorted(obj) if not self.should_discard(k, obj[k])}
        elif isinstance(obj, list):
            return sorted([self._sorted_purified_dict(x) for x in obj], key=lambda x: json.dumps(x))
        else:
            return obj

    def generate(self):
        # Sort the module dictionary recursively, excluding certain keys
        sorted_module = self._sorted_purified_dict(self._module)

        # Convert the sorted dictionary to a JSON string and encode it
        encoded_module = json.dumps(sorted_module, separators=(',', ':')).encode()

        # Create the hash and return the first 6 characters
        result = hashlib.md5(encoded_module)
        return result.hexdigest()[0:6]
