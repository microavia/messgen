![JS CI](https://github.com/pavletto/messgen/actions/workflows/js.yml/badge.svg)
![CPP CI](https://github.com/pavletto/messgen/actions/workflows/cpp.yml/badge.svg)

# Messgen

Lightweight and fast message serialization library.
Generates message classes/structs from YAML descriptions.

Features:

- Embedded-friendly
- Fixed size arrays
- Vectors (dynamic size arrays)
- Maps
- Nested messages
- Messages metadata
- Supported output formats: C++, JSON, TypeScript
- Supported output formats TODO: Go, Markdown (documentation)

## Dependencies

- Python 3.X

On Linux:

```
sudo apt install python3
```

On Windows 10:

1. Download https://bootstrap.pypa.io/get-pip.py
2. Execute `python3 get_pip.py`
3. Execute `pip3 install pyyaml`

### Build dependencies

- libgtest-dev (for testing)

## Generate messages

All data types should be placed in one directory. Each protocol can be placed in any arbitrary directory.

`types` is the base directory for type definitions (specifying multiple type directories is allowed). The subdirectories are treated as namespaces "my_company/core" or "my_company/the_product/some_items".

`protocol` is a single protocol definition file (specifying multiple protocols is allowed). The protocol consists of a base directory and protocol name separated by a colon e.g. "protocols_dir:my_namespace/protocol".

Message generator usage:

```bash
python3 messgen-generate.py --types <types_dir> --protocol <protocol> --lang <lang> --outdir <out_dir> [--options key1=value1,key2=value2,...]
```

Generated messages are placed in the `out_dir` directory.

#### C++

Example for C++ messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang cpp --outdir out/cpp --options cpp_standard=20
```

#### JSON

Example for JS messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang json --outdir out/json
```

#### TypeScript

Example for TypeScript messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang ts --outdir out/ts
```

### Basic Concepts

#### Overview

There is no "one for all" solution, and messgen is not an exception.
Before selecting messgen keep in mind:

- Statically typed: there is no "variant" type, but it's possible to work around this limitation with some tricks
- Optimized for embedded systems: systems where non-aligned access to float/int is forbidden, systems without heap
- Optimized for cross-platform compatibility (gives the same result on CPUs with different paddings, from 8bit microcontrollers to AMD64)
- Optimized for serialization/deserialization speed on C++ port, allows zero-copy in some cases
- Serialization level only, i.e. information about the type and size of the message must be added in separate header (examples provided)
- No optional fields in structs and messages
- No messages versioning


Type and protocol descriptions are stored as `.yaml` files following the structure demonstrated below.

```
procol_dir/
├── some_proto_namespace
│   ├── protocol_one.yaml
│   └── protocol_two.yaml
└── another_proto_namespace
    └── ...
```

```
types_dir/
├── some_type_namespace
│   ├── type1.yaml
│   └── type1.yaml
└── another_type_namespace
    └── ...
```

Naming style for all identifiers in yaml is strictly: `snake_case`.
In generated files identifiers will be converted to style that is specific for each port.

#### Type

The lowest level of hierarchy is **type**. It can be:

- Scalar: e.g. `int32`, `float32`, `uint8`, `bool`
- Enum: wrapper around int, described in yaml file
- Array: fixed size `element_type[<size>]`, e.g. `int32[4]`, `my_struct[3]`
- Vector: dynamic size array `element_type[]`, e.g. `int32[]`, `my_struct[]`
- Map: ordered map `value_type{key_type}`, e.g. `string{int32}`, `my_struct{int32}{string}`
- String: vector of `uint8`, representing string, `string`
- Bytes: vector of `uint8`, representing bytes buffer, `bytes`
- Struct: list of fields, described in yaml file
- External: user-defined types, user must provide serialization/deserialization methods for each port that is used (TODO)
- Alias: reference to another existing type (e.g. from another protocol) (TODO)

#### Enum

Enum may contain constants enumeration or bitfield.
Each enum defined in separate file.

For the bitfield the format should be: `(1 << n)`, where `n` is the position of the bit.

Example enum definition file (`command.yaml`):
```yaml
type_class: enum
comment: "Example of command enum"
base_type: uint8
values:
  - { name: "start", value: 0, comment: "Start node operation" }
  - { name: "stop", value: 1, comment: "Stop node operation" }
  - { name: "reset", value: 2, comment: "Reset node state" }
```

Example `flags.yaml` file with bitfield:
```yaml
type_class: enum
comment: "Example of flags bitfield"
base_type: uint8
values:
  - { name: "online", value: "(1 << 0)", comment: "Node is online" }
  - { name: "sensor_error", value: "(1 << 1)", comment: "Internal node error" }
```

#### Struct

**Structs** are the most important part of the serialization.
Each struct defined in separate file.

Example struct definition file (`baro_report.yaml`):
```yaml
type_class: struct
comment: "Barometer report"
fields:
  - { name: "timestamp", type: "uint64", comment: "[ns] Timestamp of the measurement" }
  - { name: "temp", type: "float32", comment: "[deg C] Temperature" }
  - { name: "pres", type: "float32", comment: "[Pa] Pressure" }
```

Struct itself don't have any type identifier that is serialized in the message.
Type ids can be assigned to structs in `weather_station.yaml` file (see below).

#### Protocol

**Protocol** defines the protocol ID and type IDs for structs that will be used as messages.
Type ID used during serialization/deserialization to identify the message type.
Multiple protocols may be used in one system, e.g. `my_namespace/bootloader` and `my_namespace/application`.
Parser can check the protocol by protocol ID, that can be serialized in message header.

Example protocol definition (`weather_station.yaml`):

```yaml
comment: "Weather station application protocol"
types_map:
  0: "heartbeat"
  1: "system_status"
  2: "system_command"
  3: "baro_report"
```
