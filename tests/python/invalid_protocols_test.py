import sys
import os
from messgen.protocols import Protocols
from messgen import generator

if __name__ == "__main__":
    langs = ["cpp"]
    base_dir = "tests/messages"
    proto_dir = "invalid_protocols"
    output_dir = "/tmp/messgen_tests"

    # Add all base_dir/proto_dir/* dirs as separate protocols
    proto_list = []
    for proto in os.listdir(os.path.join(base_dir, proto_dir)):
        if os.path.isdir(os.path.join(base_dir, proto_dir, proto)):
            proto_list.append(proto_dir + "/" + proto)

    for lang in langs:
        for single_proto in proto_list:
            try:
                protos = Protocols()
                protos.load([base_dir], [single_proto])
                g = generator.get_generator(lang, protos, {})
                for proto_name, proto in protos.proto_map.items():
                    g.generate(output_dir + "/" + lang, proto_name, proto)
                print("Generated " + lang + " files for proto '" + single_proto + "', but exception expected")
                sys.exit(1)
            except RuntimeError as e:
                print(f"Successfully raised exception for {single_proto} ({lang}): {e}")
