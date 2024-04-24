import { describe, it, expect, beforeAll, } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ProtocolJSON } from "../src/types";
import { Messgen } from "../src/Messgen";

let protocolData: ProtocolJSON;
let messgen: Messgen;

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
  it('shut be parse flat_struct', () => {
    const FlatStructJsonPath = path.resolve(__dirname, '../../../tests/serialized_data/json/flat_struct.json');
    const rawData = fs.readFileSync(FlatStructJsonPath);
    // @ts-ignore
    const data = JSON.parse(rawData);
    const FlatStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/flat_struct.bin');
    const rawDataBit = fs.readFileSync(FlatStructBitPath);
    
    const buffer = messgen.serialize('flat_struct', data)
    
    expect((new Uint8Array(buffer.dataView.buffer))).toEqual((new Uint8Array(
      rawDataBit)))
    
    const result = messgen.deserialize('flat_struct', new Uint8Array(rawDataBit).buffer)
    expect(result.f0.toString()).toEqual(data.f0.toString());
    expect(result.f1.toString()).toEqual(data.f1.toString());
    
    expect(result.f2).toBeCloseTo(data.f2, 5);
    expect(result.f5).toBeCloseTo(data.f5, 5);
    
    expect(result.f3).toEqual(data.f3);
    expect(result.f4).toEqual(data.f4);
    expect(result.f6).toEqual(data.f6);
    expect(result.f7).toEqual(data.f7);
    expect(result.f8).toEqual(data.f8);
  })
  
  let bigint = BigInt('1311768467294899695'); // 0x1234567890abcdef
  
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
  
})
