import os

SEPARATOR = "/"
SIZE_TYPE = "uint32"


def write_file_if_diff(fn, code_lines):
    old_code = None
    try:
        old_code = open(fn, "r").read()
    except:
        pass
    new_code = "\n".join(code_lines)
    if old_code != new_code:
        open(fn, "w+").write(new_code)
