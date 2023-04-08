![JS CI](https://github.com/pavletto/messgen/actions/workflows/js.yml/badge.svg?branch=github_actions)
![CPP CI](https://github.com/pavletto/messgen/actions/workflows/cpp.yml/badge.svg?branch=github_actions)

# Messgen

Lightweight and fast message serialization library.
Generates message classes/structs from yml scheme.

Features:

- Embedded-friendly
- Fixed size arrays
- Dynamic size arrays
- Nested messages
- Messages metadata
- Supported languages: C++, Go, JavaScript

## Dependencies

- python 3.X

On Linux:

```
sudo apt install python3
```

On Windows 10:

1. Download https://bootstrap.pypa.io/get-pip.py
2. Execute `python3 get_pip.py`
3. Execute `pip3 install pyyaml`

## Generate messages

Each protocol should be placed in directory `base_dir/vendor/protocol`.
`base_dir` is base directory for message definitions (is allowed to specify multiple base directories).
`vendor` is protocol vendor, it is used as namespace in generated messages allowing to avoid conflict between protocols from different vendors if used in one application.
`protocol` is protocol name, each protocol has protocol ID, that allows to use multiple protocols on single connection, e.g. bootloader and application protocols.

Message generator usage:
```
python3 generate.py -b <base_dir> -m <vendor>/<protocol> -l <lang> -o <out_dir> [-D variable=value]
```

For some languages it's necessary to specify some variables using `-D` option.

Generated messages placed in `out_dir` directory.

#### Go

Example for Go messages generation:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l go -o out/go -D messgen_go_module=example.com/path/to/messgen
```

Variable `messgen_go_module` must point to messgen Go module (`port/go/messgen`), to add necessary imports in generated messages.

#### C++

Example for C++ messages generation:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l cpp -o out/cpp
```

Variable `metadata_json=true` can be passed to generate metadata in JSON format, rather than legacy.

#### JS/TS

Example for JS messages generation:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l json -o out/json
```
This command will generate json messages. 

The types of these messages for TS can be generated as follows:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l ts -o out/ts
```

#### MD

Example for protocol documentation generation:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l md -o out/md
```
