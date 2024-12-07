from .json_generator import JsonGenerator
from .cpp_generator import CppGenerator
from .ts_generator import TypeScriptGenerator


def get_generator(lang: str, options):
    if lang == "json":
        return JsonGenerator(options)
    elif lang == "cpp":
        return CppGenerator(options)
    elif lang == 'ts':
        return TypeScriptGenerator(options)
