import argparse
import os

from messgen import generator, yaml_parser
from pathlib import Path


print(os.getcwd())
print(os.path.dirname(os.path.realpath(__file__)))


def generate(args: argparse.Namespace):
    if not args.protocol and not args.types:
        raise RuntimeError("No types or protocols to generate (--types or --protocols)")

    print("Options:")
    opts = {}
    for a in args.options.split(","):
        p = a.split("=")
        if len(p) == 2:
            print(f"  {p[0]} = {p[1]}")
            opts[p[0]] = p[1]

    types = yaml_parser.parse_types(args.types)
    protocols = yaml_parser.parse_protocols(args.protocol)

    if (gen := generator.get_generator(args.lang, opts)) is not None:
        if protocols and types:
            gen.generate(Path(args.outdir), types, protocols)
        elif types:
            gen.generate_types(Path(args.outdir), types)
        elif protocols:
            gen.generate_protocols(Path(args.outdir), protocols)

    else:
        raise RuntimeError("Unsupported language \"%s\"" % args.lang)

    print("Successfully generated to %s" % args.outdir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--types", action='append', help="Type directory to load, may repeat")
    parser.add_argument("--protocol", action='append', help="Protocol file to load, may repeat")
    parser.add_argument("--lang", required=True, help="Output language")
    parser.add_argument("--outdir", required=True, help="Output directory")
    parser.add_argument("--options", default="", help="Generator options")
    generate(parser.parse_args())


if __name__ == "__main__":
    main()
