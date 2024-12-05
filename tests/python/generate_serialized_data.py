import sys
from pathlib import Path

path_root = Path(__file__).parents[2]
sys.path.append(str(path_root))

from messgen.dynamic import Codec

if __name__ == "__main__":
    codec = Codec()
    codec.load(type_dirs=['tests/data/types'], protocols=["tests/data/protocols/test_proto", "tests/data/protocols/another_proto"])

    # simple_struct
    t = codec.get_type_by_name("test_proto", "messgen/test/simple_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/simple_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/simple_struct.bin")

    # var_size_struct
    t = codec.get_type_by_name("test_proto", "messgen/test/var_size_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1_vec": [-0x1234567890abcdef, 5, 1],
        "str": "Hello messgen!",
    }

    b = t.serialize(msg1)

    with open('tests/serialized_data/bin/var_size_struct.bin', 'wb') as f:
        f.write(b)

    print("Successfully generated serialized data to tests/serialized_data/bin/var_size_struct.bin")

    # struct_with_enum
    t = codec.get_type_by_name("test_proto", "messgen/test/struct_with_enum")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "e0": "another_value"
    }
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/struct_with_enum.bin', 'wb') as f:
        f.write(b)

    print("Successfully generated serialized data to tests/serialized_data/bin/struct_with_enum.bin")

    # empty_struct
    t = codec.get_type_by_name("test_proto", "messgen/test/empty_struct")
    msg1 = {}
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/empty_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/empty_struct.bin")

    # complex_struct_with_empty
    t = codec.get_type_by_name("test_proto", "messgen/test/complex_struct_with_empty")
    msg1 = {
        "e": {},  # empty_struct
        "dynamic_array": [{} for _ in range(3)],  # list of empty_struct, replace 3 with desired length
        "static_array": [{} for _ in range(5)],  # list of 5 empty_struct
        "multi_array": [[[{}] for _ in range(5)] for _ in range(3)],
        # 2D list of empty_struct, replace 3 with desired outer list length
        "map_empty_by_int": {i: {} for i in range(3)},  # map of int32 to empty_struct, replace 3 with desired map size
        "map_vec_by_str": {"key" + str(i): [{}] for i in range(3)},
        # map of string to list of empty_struct, replace 3 with desired map size
        "array_of_size_zero": [],  # empty list of int32
    }
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/complex_struct_with_empty.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/complex_struct_with_empty.bin")


    # complex_struct_nostl

    t = codec.get_type_by_name("test_proto", "messgen/test/complex_struct_nostl")
    simple_struct = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x12345678,
        "f2": 0x1234567890abcdef,
        "s_arr": [ simple_struct for _ in range(2)],
        "f1_arr": [0x1234567890abcdef for _ in range(4)],
        "v_arr": [{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                  range(2)],
        "f2_vec": [1.2345678901234567890 for _ in range(3)],
        "e_vec": ["one_value", "another_value"],
        "s_vec": [ simple_struct for _ in range(3)],
        "v_vec0": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(2)] for _ in range(3)],  # replace 3 with desired outer list length
        "v_vec1": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(3)] for _ in range(4)],  # replace 3 with desired outer list length
        "v_vec2": [[[0x1234 for _ in range(3)] for _ in range(4)] for _ in range(2)],
        "str": "Example String",
        "str_vec": ["string1", "string2", "string3"],
    }
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/complex_struct_nostl.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/complex_struct_nostl.bin")


    # complex_struct
    t = codec.get_type_by_name("test_proto", "messgen/test/complex_struct")

    simple_struct = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x12345678,
        "f2": 0x1234567890abcdef,
        "s_arr": [simple_struct for _ in range(2)],
        "f1_arr": [0x1234567890abcdef for _ in range(4)],
        "v_arr": [{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                  range(2)],
        "f2_vec": [1.2345678901234567890 for _ in range(3)],
        "e_vec": ["one_value", "another_value"],
        "s_vec": [simple_struct for _ in range(3)],
        "v_vec0": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(2)] for _ in range(3)],  # replace 3 with desired outer list length
        "v_vec1": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(3)] for _ in range(4)],  # replace 3 with desired outer list length
        "v_vec2": [[[0x1234 for _ in range(3)] for _ in range(4)] for _ in range(2)],
        "str": "Example String",
        "bs": b"byte string",
        "str_vec": ["string1", "string2", "string3"],
        "map_str_by_int": {i: "string" + str(i) for i in range(3)},
        "map_vec_by_str": {"key" + str(i): [0x1234 for _ in range(3)] for i in range(3)},
    }
    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/complex_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/complex_struct.bin")


    # flat_struct

    t = codec.get_type_by_name("test_proto", "messgen/test/flat_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }

    b = t.serialize(msg1)
    with open('tests/serialized_data/bin/flat_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/serialized_data/bin/flat_struct.bin")

    print("Successfully")
