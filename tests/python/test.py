import sys
from pathlib import Path
path_root = Path(__file__).parents[2]
sys.path.append(str(path_root))
from messgen.dynamic import Codec

if __name__ == "__main__":
    print(Codec)
    codec = Codec()
    codec.load(["tests/messages"], ["messgen/test_proto"])

    t = codec.get_type_by_name("messgen/test_proto", "simple_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    b = t.serialize(msg1)
    print("Type name:", t.type_name)
    print("Type ID:", t.id)
    print("Original msg:", msg1)
    print(b)
    msg2, sz = t.deserialize(b)
    assert sz == len(b)
    print("Size:", len(b))
    print("Deserialized msg:", msg2)
    print()

    t = codec.get_type_by_name("messgen/test_proto", "var_size_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1_vec": [-0x1234567890abcdef, 5, 1],
        "str": "Hello messgen!",
    }
    b = t.serialize(msg1)
    print("Type name:", t.type_name)
    print("Type ID:", t.id)
    print("Original msg:", msg1)
    print(b)
    msg2, sz = t.deserialize(b)
    assert sz == len(b)
    print("Size:", len(b))
    print("Deserialized msg:", msg2)
