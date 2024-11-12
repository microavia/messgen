from .json_generator import JsonGenerator
from .cpp_generator import CppGenerator
from .ts_generator_v2 import TypeScriptGenerator


def get_generator(lang: str, protos, options):
    if lang == "json":
        return JsonGenerator(protos, options)
    elif lang == "cpp":
        return CppGenerator(protos, options)
    elif lang == 'ts':
        return TypeScriptGenerator(protos, options)
