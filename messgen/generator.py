from .json_generator import JsonGenerator
from .cpp_generator import CppGenerator

_GENERATORS = {
    "json": JsonGenerator,
    "cpp": CppGenerator,
}


def get_generator(lang: str):
    return _GENERATORS.get(lang)
