import getpass
import os
import pytest

from itertools import product
from pathlib import Path

from messgen import (
    generator,
    yaml_parser,
    model,
    validation,
)


_OUTPUT_DIR = Path("/") / "tmp" / getpass.getuser() / "messgen_tests"
_TYPE_DIRS = list((Path() / "tests" / "data" / "types_invalid").glob("*"))


@pytest.mark.parametrize("lang, types_dir", product(["cpp"], _TYPE_DIRS))
def test_yaml_parser_validation(lang, types_dir):
    with pytest.raises(Exception):
        types = yaml_parser.parse_types([types_dir])
        generator.get_generator(lang, {}).generate_types(types, _OUTPUT_DIR)


def test_validate_protocol_correct():
    test_type = model.StructType(type="types/test", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    proto = model.Protocol(
        name="test",
        proto_id=1,
        messages={0: model.Message(message_id=0, name="some_msg", type=test_type.type, comment=""),
                  1: model.Message(message_id=1, name="other_msg", type=test_type.type, comment="")},
    )

    validation.validate_protocol(protocol=proto, types={test_type.type: test_type.type})


def test_validate_protocol_id_mismatch():
    test_type = model.StructType(type="types/test", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    proto = model.Protocol(
        name="test",
        proto_id=1,
        messages={0: model.Message(message_id=0, name="some_msg", type=test_type.type, comment=""),
                  1: model.Message(message_id=0, name="other_msg", type=test_type.type, comment="")},
    )

    with pytest.raises(RuntimeError, match="Message other_msg has different message_id=0 than key=1 in protocol=test"):
        validation.validate_protocol(protocol=proto, types={test_type.type: test_type.type})


def test_validate_protocol_missing_type():
    test_type = model.StructType(type="types/test", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    proto = model.Protocol(
        name="test",
        proto_id=1,
        messages={0: model.Message(message_id=0, name="some_msg", type="types/missing", comment="")},
    )

    with pytest.raises(RuntimeError, match="Type types/missing required by message=some_msg protocol=test not found"):
        validation.validate_protocol(protocol=proto, types={test_type.type: test_type})


def test_validate_protocol_duplicated_msg_name():
    test_type = model.StructType(type="types/test", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    proto = model.Protocol(
        name="test",
        proto_id=1,
        messages={0: model.Message(message_id=0, name="some_msg", type=test_type.type, comment=""),
                  1: model.Message(message_id=1, name="some_msg", type=test_type.type, comment="")},
    )

    with pytest.raises(RuntimeError, match="Message with name=some_msg appears multiple times in protocol=test"):
        validation.validate_protocol(protocol=proto, types={test_type.type: test_type.type})


def test_validate_types_no_conflict():
    type1 = model.StructType(type="types/test1", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    type2 = model.StructType(type="types/test2", type_class=model.TypeClass.struct, comment="", fields=[], size=None)

    try:
        validation.validate_types({type1.type: type1, type2.type: type2})
    except RuntimeError:
        pytest.fail("validate_types raised RuntimeError unexpectedly!")


def test_validate_types_with_conflict():
    type1 = model.StructType(type="types/test1", type_class=model.TypeClass.struct, comment="", fields=[], size=None)
    type2 = model.StructType(type="types/test2", type_class=model.TypeClass.struct, comment="", fields=[], size=None)

    with pytest.raises(RuntimeError, match="Type types/test2 has the same hash as types/test1"):
        validation.validate_types({type1.type: type1, type2.type: type1})
