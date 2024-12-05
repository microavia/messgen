import sys
import os

from pathlib import Path

path_root = Path(__file__).parents[2]
sys.path.append(str(path_root))

from messgen import (
    generator,
    yaml_parser,
)

if __name__ == "__main__":
    langs = ["cpp"]
    types_dir = Path("tests/types_invalid")
    output_dir = "/tmp/messgen_tests"

    for lang in langs:
        gen = generator.get_generator(lang, {})
        for types_subdir in types_dir.glob("*"):
            if not os.path.isdir(types_subdir):
                continue

            try:
                types = yaml_parser.parse_types([types_subdir])
                print("Generated " + lang + " files for types '" + types_dir + "', but exception expected")
                sys.exit(1)
            except RuntimeError as e:
                print(f"Successfully raised exception for {types_dir} ({lang}): {e}")
