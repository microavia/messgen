![JS CI](https://github.com/pavletto/messgen/actions/workflows/js.yml/badge.svg)
![CPP CI](https://github.com/pavletto/messgen/actions/workflows/cpp.yml/badge.svg)

# Messgen

Lightweight and fast message serialization library.
Generates message classes/structs from yml scheme.

Features:

- Embedded-friendly
- Fixed _size arrays
- Vectors (dynamic _size arrays)
- Maps
- Nested messages
- Messages metadata
- Supported languages: C++, Go, JavaScript, TypeScript, Markdown (documentation)

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

### Basic Concepts

#### Overview

There is no "one for all" solution, and messgen is not an exception.
Before selecting messgen keep in mind:

- Statically typed: the is no "variant" type, but it's possible to work around this limitation with some tricks
- Optimized for embedded systems: systems where non-aligned access to float/int is forbidden, systems without heap
- Optimized for cross-platform compatibility (gives the same result on CPUs with different paddings, from 8bit microcontrollers to AMD64)
- Optimized for serialization/deserialization speed on C++ port, close to zero-copy in most of the cases
- Serialization level only, i.e. information about the type and _size of the message must be added in separate header (examples provided)
- No optional fields in structs and messages

Protocol description stored in set `.yaml` files in following structure:

```
protocols/
├── one_protocol
│   ├── _protocol.yaml
│   ├── _enums.yaml
│   ├── one_struct.yaml
│   └── another_struct.yaml
└── another_protocol
    └── ...
```

Naming style for all identifiers in yaml is strictly: `snake_case`.
In generated files identifiers will be converted to style that is specific for each port.

#### Type

The lowest level of hierarchy is **type**. It can be:

- Scalar: e.g. `int32`, `float32`, `uint8`, `bool`
- Enum: wrapper around scalar, e.g. `command`
- Array: fixed _size, e.g. `int32[4]`, `my_struct[3]`
- Vector: dynamic _size array, e.g. `int32[]`, `my_struct[]`
- Map: ordered map, e.g. `string{int32}`, `my_struct{int32}{string}`
- String: vector of `uint8`, representing string, `string`
- Struct: described in yaml file and consists of other types, including other structs
- External: user-defined types, user must provide serialization/deserialization methods for each port that is used
- Alias: reference to another existing type (e.g. from another protocol)

#### Enum

All **enums** must be listed in file `_enums.yaml`.

Enum may contain constants enumeration or bitfield.
For the bitfield the format should be: `(1 << n)`, where `n` is the position of the bit.

Example `_enum.yaml` file:
```yaml
- name: command
  basetype: uint8
  descr: "Node command"
  values:
    - { name: "start", value: 0, descr: "Start node operation" }
    - { name: "stop", value: 1, descr: "Stop node operation" }
    - { name: "reset", value: 2, descr: "Reset node state" }

- name: status_flags
  basetype: uint8
  descr: "Node status flags bitfield"
  values:
    - { name: "online", value: "(1 << 0)", descr: "Node is online" }
    - { name: "sensor_error", value: "(1 << 1)", descr: "Internal node error" }
```

#### Struct

**Structs** are the most important part of the serialization.
Struct itself don't have any type identifier that is serialized in the message, parser must know the type in advance.

Each struct defined in separate file.

Example struct definition file (`baro_report.yaml`):
```yaml
descr: "Barometer report"
fields:
  - { name: "timestamp", type: "uint64", descr: "[ns] Timestamp of the measurement" }
  - { name: "temp", type: "float32", descr: "[deg C] Temperature" }
  - { name: "pres", type: "float32", descr: "[Pa] Pressure" }
```

#### Protocol and Message

**Protocol** defines the protocol ID and the set of the messages with their identifiers.
Multiple protocols may be used in one system, e.g. `bootloader` and `application`.
Parser can check the protocol by protocol ID, that can be serialized in message header.

**Message** is a struct with associated type id (integer number), that is used to identify the message on deserialization.

Example protocol definition (`weather_station/_protocol.yaml`):

```yaml
descr: "Weather station application protocol"
messages:
  - heartbeat: { id: 0 }  # By default, `type` field is equal to message name from current protocol
  - system_status: { id: 1 }
  - system_command: { id: 2, type: "" }
  - baro_report_internal: { id: 3, type: "baro_report" }
  - baro_report_external: { id: 4, type: "baro_report" }
```

As shown in the example, it's possible to define multiple messages with the same underlying struct, this may be useful to serialize multiple channels of information, e.g.:

In pub/sub model message corresponds to the topic.
