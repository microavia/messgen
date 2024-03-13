from .cpp_generator import CppGenerator
from .go_generator import GoGenerator
from .json_generator import JsonGenerator


def get_generator(lang: str, protos, options):
    if lang == "json":
        return JsonGenerator(protos, options)
    elif lang == "cpp":
        return CppGenerator(protos, options)
    elif lang == "go":
        return GoGenerator(protos, options)
