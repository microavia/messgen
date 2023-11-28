from .json_generator import JsonGenerator
from .cpp_generator import CppGenerator


def get_generator(lang: str, protos, options):
    if lang == "json":
        return JsonGenerator(protos, options)
    elif lang == "cpp":
        return CppGenerator(protos, options)
