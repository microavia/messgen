from . json_generator2 import JsonGenerator
from . cpp_generator2 import CppGenerator

_GENERATORS = {
    "json": JsonGenerator,
    "cpp": CppGenerator,
}

def get_generator(lang: str):
    return _GENERATORS.get(lang)
