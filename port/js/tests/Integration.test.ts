import { describe, it, expect, beforeAll, } from 'vitest';
import { execSync } from 'child_process';
import { Codec } from "../src/Codec";
import { uploadShema, uploadBinary } from "./utils";
import { ProtocolJSON } from '../src/protocol/Protocol.types';


describe('integration', () => {
  let protocolData: ProtocolJSON;
  let codec: Codec;
  const bigint = BigInt('0x1234567890abcdef');

  beforeAll(() => {
    execSync(' npm run generate-bit')
    execSync(' npm run gen-json')
    protocolData = uploadShema('./messgen/test_proto/protocol.json')
    codec = new Codec([protocolData])
  })


  it('should initialize codec with protocols', () => {
    expect(() => new Codec([protocolData])).not.toThrow()
  })


  it('shpuld parse simple_struct (flat structure)', () => {
    const rawData = {
      "f0": bigint,
      "f1": bigint,
      "f1_pad": 0x12,
      "f2": 1.2345678901234567890,
      "f3": 0x12345678,
      "f4": 0x12345678,
      "f5": 1.2345678901234567890,
      "f6": 0x1234,
      "f7": 0x12,
      "f8": -0x12,
      "f9": true,
    }
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/simple_struct.bin')


    const buffer = codec.serialize('messgen/test_proto', 'simple_struct', rawData)
    const result = codec.deserialize(1, 0, new Uint8Array(rawDataBit).buffer)

    expect(result).toEqual({ ...rawData, f5: expect.closeTo(rawData.f5, 5), });
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(rawDataBit)))
  })

  it('shut be parse var_size_struct.bin', () => {
    const rawData = {
      "f0": bigint,
      "f1_vec": new BigInt64Array([-bigint, BigInt(5), BigInt(1)]),
      "str": "Hello messgen!",
    }
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/var_size_struct.bin')

    const buffer = codec.serialize('messgen/test_proto', 'var_size_struct', rawData)
    const result = codec.deserialize(1, 2, new Uint8Array(rawDataBit).buffer)

    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(rawDataBit)))


  })

  it('should parse enum struct_with_enum', () => {
    const rawData = { "f0": bigint, "f1": bigint, "e0": 1 }
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/struct_with_enum.bin')

    const buffer = codec.serialize('messgen/test_proto', 'struct_with_enum', rawData)
    const result = codec.deserialize(1, 3, new Uint8Array(rawDataBit).buffer)

    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(rawDataBit)))
  })

  it('should parse empty structure', () => {
    const rawData = {}
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/empty_struct.bin')

    const buffer = codec.serialize('messgen/test_proto', 'empty_struct', rawData)
    const result = codec.deserialize(1, 4, new Uint8Array(rawDataBit).buffer)

    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(rawDataBit)))
  })

  it('should parse complex struct with nested empty struct', () => {
    const rawData = {
      "e": {},
      "dynamic_array": [{}, {}, {}],
      "static_array": [{}, {}, {}, {}, {}],
      "multi_array": [
        [[{}], [{}], [{}], [{}], [{}]],
        [[{}], [{}], [{}], [{}], [{}]],
        [[{}], [{}], [{}], [{}], [{}]],
      ],
      "map_empty_by_int": new Map([
        [0, {}],
        [1, {}],
        [2, {}],
      ]),
      "map_vec_by_str": new Map([
        ["key0", [{}]],
        ["key1", [{}]],
        ["key2", [{}]],
      ]),
      "array_of_size_zero": new Int32Array(0),
    }
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/complex_struct_with_empty.bin')

    const buffer = codec.serialize('messgen/test_proto', 'complex_struct_with_empty', rawData)
    const result = codec.deserialize(1, 5, new Uint8Array(rawDataBit).buffer)

    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })

  it('shut be parse complex_struct_nostl', () => {
    const simpleStruct = {
      "f0": bigint,
      "f1": bigint,
      "f1_pad": 0x12,
      "f2": 1.2345678901234567890,
      "f3": 0x12345678,
      "f4": 0x12345678,
      "f5": 1.2345678901234567890,
      "f6": 0x1234,
      "f7": 0x12,
      "f8": -0x12,
      "f9": true,
    }

    const rawData = {
      "f0": BigInt("0x1234567890abcdef"),
      "f1": 0x12345678,
      "f2": BigInt("0x1234567890abcdef"),
      "s_arr": Array(2).fill(simpleStruct),
      "f1_arr": new BigInt64Array(4).fill(BigInt("0x1234567890abcdef")),
      "v_arr": Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      }),
      "f2_vec": new Float64Array(3).fill(1.2345678901234567890),
      "e_vec": [
        0,
        1],
      "s_vec": Array(3).fill(simpleStruct),
      "v_vec0": Array(3).fill(Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      })),  // replace 3 with desired outer list length
      "v_vec1": Array(4).fill(Array(3).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      })),  // replace 3 with desired outer list length
      "v_vec2": Array(2).fill(Array(4).fill(new Int16Array(3).fill(0x1234))),  // replace 2 with desired outer list length
      "str": "Example String",
      "str_vec": ["string1", "string2", "string3"],
    };
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/complex_struct_nostl.bin')

    const buffer = codec.serialize('messgen/test_proto', 'complex_struct_nostl', rawData)
    const result = codec.deserialize(1, 6, new Uint8Array(rawDataBit).buffer)

    simpleStruct.f5 = expect.closeTo(simpleStruct.f5, 4)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))

  })
  it('should parse complex_struct', () => {
    const simpleStruct = {
      "f0": BigInt("0x1234567890abcdef"),
      "f1": BigInt("0x1234567890abcdef"),
      "f1_pad": 0x12,
      "f2": 1.2345678901234567890,
      "f3": 0x12345678,
      "f4": 0x12345678,
      "f5": 1.2345678901234567890,
      "f6": 0x1234,
      "f7": 0x12,
      "f8": -0x12,
      "f9": true,
    };

    const rawData = {
      "f0": BigInt("0x1234567890abcdef"),
      "f1": 0x12345678,
      "f2": BigInt("0x1234567890abcdef"),
      "s_arr": Array(2).fill(simpleStruct),
      "f1_arr": new BigInt64Array(4).fill(BigInt("0x1234567890abcdef")),
      "v_arr": Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      }),
      "f2_vec": new Float64Array(3).fill(1.2345678901234567890),
      "e_vec": [0, 1],
      "s_vec": Array(3).fill(simpleStruct),
      "v_vec0": Array(3).fill(Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      })),
      "v_vec1": Array(4).fill(Array(3).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": new BigInt64Array([BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)]),
        "str": "Hello messgen!"
      })),
      "v_vec2": Array(2).fill(Array(4).fill(new Int16Array(3).fill(0x1234))),
      "str": "Example String",
      "bs": new Uint8Array([0x62, 0x79, 0x74, 0x65, 0x20, 0x73, 0x74, 0x72, 0x69, 0x6e, 0x67]), // "byte string"
      "str_vec": ["string1", "string2", "string3"],
      "map_str_by_int": new Map(Array.from({ length: 3 }, (_, i) => [i, "string" + i])),
      "map_vec_by_str": new Map(Array.from({ length: 3 }, (_, i) => ["key" + i,
      new Int32Array(3).fill(0x1234)])),
    };
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/complex_struct.bin')

    const buffer = codec.serialize('messgen/test_proto', 'complex_struct', rawData)
    const result = codec.deserialize(1, 1, new Uint8Array(rawDataBit).buffer)

    simpleStruct.f5 = expect.closeTo(simpleStruct.f5, 4)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })

  it('should parse flat structure flat_struct', () => {
    const rawData = {
      "f0": bigint,
      "f1": bigint,
      "f2": 1.2345678901234567890,
      "f3": 0x12345678,
      "f4": 0x12345678,
      "f5": 1.2345678901234567890,
      "f6": 0x1234,
      "f7": 0x12,
      "f8": -0x12,
    }
    const rawDataBit = uploadBinary('../../../tests/serialized_data/bin/flat_struct.bin')

    const buffer = codec.serialize('messgen/test_proto', 'flat_struct', rawData)
    const result = codec.deserialize(1, 7, new Uint8Array(rawDataBit).buffer)

    rawData.f5 = expect.closeTo(rawData.f5, 5)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(rawDataBit)))
  })
})
