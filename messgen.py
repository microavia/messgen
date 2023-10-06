import argparse
from messgen.protocols import Protocols
from messgen import generator

def generate(args):
    if not args.protocol:
        raise RuntimeError("No protocols to generate (--protocol)")

    protos = Protocols()
    protos.load(args.basedir, args.protocol)

    g = generator.get_generator(args.lang, protos)
    if g is None:
        raise RuntimeError("Unsupported language \"%s\"" % args.lang)

    for proto_name, proto in protos.proto_map.items():
        g.generate(args.outdir, proto_name, proto)

    print("Successfully generated to %s" % args.outdir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--basedir", action='append', help="Base directory for searching for protocol definitions")
    parser.add_argument("--protocol", action='append', help="Protocol to load")
    parser.add_argument("--lang", required=True, help="Output language")
    parser.add_argument("--outdir", required=True, help="Output directory")
    args = parser.parse_args()
    generate(args)
