import argparse
import os
import json

from messgen import generator, yaml_parser
from dataclasses import asdict


print(os.getcwd())
print(os.path.dirname(os.path.realpath(__file__)))


def generate(args: argparse.Namespace):
    if not args.protocols and not args.types:
        raise RuntimeError("No types or protocols to generate (--types or --protocols)")

    print("Options:")
    opts = {}
    for a in args.options.split(","):
        p = a.split("=")
        if len(p) == 2:
            print("  %s = %s", p[0], p[1])
            opts[p[0]] = p[1]

    types = yaml_parser.parse_types(args.types)
    for type_name, type_repr in types.items():
        print(f"{type_name}:")
        print(json.dumps(asdict(type_repr), indent=2))

    g = generator.get_generator(args.lang, protos, opts)
    if g is None:
        raise RuntimeError("Unsupported language \"%s\"" % args.lang)

    for proto_name, proto in protos.proto_map.items():
        g.generate(args.outdir, proto_name, proto)

    print("Successfully generated to %s" % args.outdir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--types", action='append', help="Type directories to load, may repeat")
    parser.add_argument("--protocols", action='append', help="Protocol files to load, may repeat")
    parser.add_argument("--lang", required=True, help="Output language")
    parser.add_argument("--outdir", required=True, help="Output directory")
    parser.add_argument("--options", default="", help="Generator options")
    generate(parser.parse_args())


if __name__ == "__main__":
    main()
