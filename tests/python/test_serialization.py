import pytest

from messgen.dynamic import Codec


@pytest.fixture
def codec():
    codec_ = Codec()
    codec_.load(type_dirs=['tests/data/types'], protocols=["tests/data/protocols:test_proto"])
    yield codec_


@pytest.fixture
def simple_struct():
    return {
        "f0": 0x1234567890abcdef,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }


def test_serialization1(codec, simple_struct):
    type_def = codec.get_type_serializer("messgen/test/simple_struct")
    expected_msg = simple_struct
    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    for key in expected_msg:
        assert actual_msg[key] == pytest.approx(expected_msg[key])


def test_serialization2(codec):
    type_def = codec.get_type_serializer("messgen/test/var_size_struct")
    expected_msg = {
        "f0": 0x1234567890abcdef,
        "f1_vec": [-0x1234567890abcdef, 5, 1],
        "str": "Hello messgen!",
    }

    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    assert actual_msg == expected_msg


def test_protocol_deserialization(codec, simple_struct):
    proto_id, type_id, expected_bytes = codec.serialize("test_proto", "messgen/test/simple_struct", simple_struct)
    assert expected_bytes

    print(proto_id, type_id)

    proto_name, type_name, actual_msg = codec.deserialize(proto_id=proto_id, type_id=type_id, data=expected_bytes)

    assert type_name == "messgen/test/simple_struct"
    assert proto_name == "test_proto"

    for key in simple_struct:
        assert actual_msg[key] == pytest.approx(simple_struct[key])
