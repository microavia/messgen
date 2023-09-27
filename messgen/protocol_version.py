import hashlib
import json


def version_hash(proto):
    result = hashlib.md5(json.dumps(proto).encode())

    return result.hexdigest()[0:6]
