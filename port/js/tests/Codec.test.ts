import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from "child_process";
import { Codec } from "../src/Codec";
import { ProtocolJSON, } from "../src/types";
import { uploadShema } from './utils';


describe('Codec', () => {
  let testProtoData: ProtocolJSON;
  let anotherProtoData: ProtocolJSON;

  beforeAll(() => {
    execSync('npm run gen-json')
    testProtoData = uploadShema('./messgen/test_proto/protocol.json')
    anotherProtoData = uploadShema('./another_proto/protocol.json')

  })
  describe('init example', () => {
    it('should initialize the messages', () => {

      const codec = new Codec([testProtoData, anotherProtoData]);
      expect(codec).toBeDefined();

    })

    it('should serialize and deserialize a message', () => {
      // Given
      const codec = new Codec([testProtoData, anotherProtoData]);
      let bigint = BigInt('0x1234567890abcdef');
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

      // When
      const message = codec.serialize('messgen/test_proto', 'simple_struct', rawData);
      const result = codec.deserialize(1, 0, message.buffer);

      // Then
      expect(result).toEqual({
        ...rawData,
        f5: expect.closeTo(rawData.f5, 5),
      });
    })

    it('should surialize and deserialize a message with cors', () => {
      // Given
      const messgen = new Codec([testProtoData, anotherProtoData]);
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      }

      // When
      const message = messgen.serialize(
        'another_proto',
        'cross_proto',
        rawData
      );
      const result = messgen.deserialize(2, 0, message.buffer);

      // Then
      expect(result).toEqual(rawData);
    })
  })
});
