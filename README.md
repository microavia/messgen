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
`vendor` is protocol vendor, it is used as namespace in generated massages allowing to avoid conflict between protocols from different vendors if used in one application.
`protocol` is protocol name, each protocol has protocol ID, that allows to use multiple protocols on single connection, e.g. bootloader and application protocols.

Message generator usage:
```
python3 generate.py -b <base_dir> -m <vendor>/<protocol> -l <lang> -o <out_dir>
```

#### Go

Example for Go messages generation:

```
python3 generate.py -b ./base_dir -m my_vendor/my_protocol -l go -o out/go
```

Generated messages for protocol `my_vendor/my_protocol` placed in out/go directory.
