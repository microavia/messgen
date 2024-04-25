import { describe, it, expect, beforeAll, } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ProtocolJSON } from "../src/types";
import { Messgen } from "../src/Messgen";

let protocolData: ProtocolJSON;
let messgen: Messgen;
let bigint = BigInt('0x1234567890abcdef');

describe('integration', () => {
  
  beforeAll(() => {
    execSync(' npm run generate-bit')
    execSync(' npm run gen-json')
    const protocolPath = path.resolve(__dirname, './messgen/test_proto/protocol.json');
    const rawData = fs.readFileSync(protocolPath);
    // @ts-ignore
    protocolData = JSON.parse(rawData);
    
    messgen = new Messgen(protocolData)
  })
  
  
  it('shut be init messgen', () => {
    expect(() => {
      return new Messgen(protocolData)
    }).not.toThrow()
  })
  
  
  it('shut be parse simple_struct.bin', () => {
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
    
    const SimpleStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/simple_struct.bin');
    const rawDataBit = fs.readFileSync(SimpleStructBitPath);
    
    
    const buffer = messgen.serialize('simple_struct', rawData)
    const result = messgen.deserialize('simple_struct', new Uint8Array(rawDataBit).buffer)
    
    expect(result).toEqual({
      ...rawData,
      f5: expect.closeTo(rawData.f5, 5),
    });
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })
  
  it('shut be parse var_size_struct.bin', () => {
    
    const rawData = {
      "f0": bigint,
      "f1_vec": [-bigint, BigInt(5), BigInt(1)],
      "str": "Hello messgen!",
    }
    
    const VarSizeStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/var_size_struct.bin');
    const rawDataBit = fs.readFileSync(VarSizeStructBitPath);
    
    const buffer = messgen.serialize('var_size_struct', rawData)
    const result = messgen.deserialize('var_size_struct', new Uint8Array(rawDataBit).buffer)
    
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
    
    
  })
  
  it('shut be parse struct_with_enum.bin', () => {
    
    const rawData = {
      "f0": bigint,
      "f1": bigint,
      "e0": "another_value"
    }
    
    const StructWithEnumBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/struct_with_enum.bin');
    const rawDataBit = fs.readFileSync(StructWithEnumBitPath);
    
    const buffer = messgen.serialize('struct_with_enum', rawData)
    const result = messgen.deserialize('struct_with_enum', new Uint8Array(rawDataBit).buffer)
    
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })
  
  it('shut be parse empty_struct', () => {
    
    const rawData = {}
    
    const EmptyStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/empty_struct.bin');
    const rawDataBit = fs.readFileSync(EmptyStructBitPath);
    
    const buffer = messgen.serialize('empty_struct', rawData)
    const result = messgen.deserialize('empty_struct', new Uint8Array(rawDataBit).buffer)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })
  
  it('shut be parse complex_struct_with_empty', () => {
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
      "array_of_size_zero": [],
    }
    
    const ComplexStructWithEmptyBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/complex_struct_with_empty.bin');
    const rawDataBit = fs.readFileSync(ComplexStructWithEmptyBitPath);
    
    const buffer = messgen.serialize('complex_struct_with_empty', rawData)
    const result = messgen.deserialize('complex_struct_with_empty', new Uint8Array(rawDataBit).buffer)
    
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
      "f1_arr": Array(4).fill(BigInt("0x1234567890abcdef")),
      "v_arr": Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      }),
      "f2_vec": Array(3).fill(1.2345678901234567890),
      "e_vec": [
        "one_value",
        "another_value"],
      "s_vec": Array(3).fill(simpleStruct),
      "v_vec0": Array(3).fill(Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      })),  // replace 3 with desired outer list length
      "v_vec1": Array(4).fill(Array(3).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      })),  // replace 3 with desired outer list length
      "v_vec2": Array(2).fill(Array(4).fill(Array(3).fill(0x1234))),  // replace 2 with desired outer list length
      "str": "Example String",
      "str_vec": ["string1", "string2", "string3"],
    };
    
    const ComplexStructNostlBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/complex_struct_nostl.bin');
    const rawDataBit = fs.readFileSync(ComplexStructNostlBitPath);
    
    const buffer = messgen.serialize('complex_struct_nostl', rawData)
    const result = messgen.deserialize('complex_struct_nostl', new Uint8Array(rawDataBit).buffer)
    
    simpleStruct.f5 = expect.closeTo(simpleStruct.f5, 4)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
    
  })
  it('shut be parse complex_struct', () => {
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
      "f1_arr": Array(4).fill(BigInt("0x1234567890abcdef")),
      "v_arr": Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      }),
      "f2_vec": Array(3).fill(1.2345678901234567890),
      "e_vec": ["one_value", "another_value"],
      "s_vec": Array(3).fill(simpleStruct),
      "v_vec0": Array(3).fill(Array(2).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      })),
      "v_vec1": Array(4).fill(Array(3).fill({
        "f0": BigInt("0x1234567890abcdef"),
        "f1_vec": [BigInt("0x1234567890abcdef"), BigInt(5), BigInt(1)],
        "str": "Hello messgen!"
      })),
      "v_vec2": Array(2).fill(Array(4).fill(Array(3).fill(0x1234))),
      "str": "Example String",
      "bs": new Uint8Array([0x62, 0x79, 0x74, 0x65, 0x20, 0x73, 0x74, 0x72, 0x69, 0x6e, 0x67]), // "byte string"
      "str_vec": ["string1", "string2", "string3"],
      "map_str_by_int": new Map(Array.from({ length: 3 }, (_, i) => [i, "string" + i])),
      "map_vec_by_str": new Map(Array.from({ length: 3 }, (_, i) => ["key" + i, Array(3).fill(0x1234)])),
    };
    
    const ComplexStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/complex_struct.bin');
    const rawDataBit = fs.readFileSync(ComplexStructBitPath);
    
    const buffer = messgen.serialize('complex_struct', rawData)
    const result = messgen.deserialize('complex_struct', new Uint8Array(rawDataBit).buffer)
    
    simpleStruct.f5 = expect.closeTo(simpleStruct.f5, 4)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
  })
  
  it('shut be parse flat_struct', () => {
    
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
    
    const FlatStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/flat_struct.bin');
    const rawDataBit = fs.readFileSync(FlatStructBitPath);
    
    const buffer = messgen.serialize('flat_struct', rawData)
    const result = messgen.deserialize('flat_struct', new Uint8Array(rawDataBit).buffer)
    
    rawData.f5 = expect.closeTo(rawData.f5, 5)
    expect(result).toEqual(rawData);
    expect(buffer.size).toEqual(rawDataBit.length)
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
    
  })
  
})
