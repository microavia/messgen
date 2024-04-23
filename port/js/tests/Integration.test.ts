import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ProtocolJSON } from "../src/types";
import { Messgen } from "../src/Messgen";

let protocolData: ProtocolJSON;

describe('integration', () => {
  
  beforeAll(() => {
    
    execSync(' npm run gen-json')
    const protocolPath = path.resolve(__dirname, './messgen/test_proto/protocol.json');
    const rawData = fs.readFileSync(protocolPath);
    // @ts-ignore
    protocolData = JSON.parse(rawData);
  })
  
  
  it('shut be init messgen', () => {
    expect(() => {
      return new Messgen(protocolData)
      
    }).not.toThrow()
    
  })
  it('shut be parse flat_struct.json', () => {
    const FlatStructJsonPath = path.resolve(__dirname, '../../../tests/serialized_data/json/flat_struct.json');
    const rawData = fs.readFileSync(FlatStructJsonPath);
    // @ts-ignore
    const data = JSON.parse(rawData);
    const FlatStructBitPath = path.resolve(__dirname, '../../../tests/serialized_data/bin/flat_struct.bin');
    const rawDataBit = fs.readFileSync(FlatStructBitPath);
    
    const messgen = new Messgen(protocolData)
    
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
})
