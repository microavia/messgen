from .json_generator import JsonGenerator
from .cpp_generator import CppGenerator


def get_generator(lang: str, protos):
    if lang == "json":
        return JsonGenerator(protos)
    elif lang == "cpp":
        return CppGenerator(protos, mode="stl")
    elif lang == "cpp_nostl":
        return CppGenerator(protos, mode="nostl")
