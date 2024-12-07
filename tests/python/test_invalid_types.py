import getpass
import os
import pytest

from itertools import product
from pathlib import Path

from messgen import (
    generator,
    yaml_parser,
)

_GENERATOR_LANGS = ["cpp"]
_OUTPUT_DIR = Path("/") / "tmp" / getpass.getuser() / "messgen_tests"
_TYPE_DIRS = list((Path() / "tests" / "data" / "types_invalid").glob("*"))


@pytest.mark.parametrize("lang, types_dir", product(["cpp"], _TYPE_DIRS))
def test_yaml_parser_validation(lang, types_dir):
    with pytest.raises(Exception):
        types = yaml_parser.parse_types([types_dir])
        generator.get_generator(lang, {}).generate_types(types, _OUTPUT_DIR)
