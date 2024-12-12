// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { Codec } from '../src/Codec';
import { uploadTypes, uploadProtocols } from './utils';
import type { Protocol, RawType } from '../src/protocol';

describe('Codec', () => {
  let types: RawType[];
  let protocols: Protocol[];
  let codec: Codec;

  beforeAll(() => {
    execSync('npm run gen:json');
    types = uploadTypes('./types.json');
    protocols = uploadProtocols('./protocols.json');
    codec = new Codec(types, protocols);
  });
  describe('init example', () => {
    it('should initialize the messages', () => {
      expect(new Codec(types, protocols)).toBeDefined();
    });

    it('should serialize and deserialize a message', () => {
      const bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        f0: bigint,
        f1: bigint,
        f1_pad: 0x12,
        f2: 1.2345678901234567890,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.2345678901234567890,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
        f9: true,
      };

      const message = codec.serialize('test_proto', 'messgen/test/simple_struct', rawData);

      expect(codec.deserialize(1, 0, message.buffer)).toEqual({
        ...rawData,
        f5: expect.closeTo(rawData.f5, 5),
      });
    });

    it('should surialize and deserialize a message with cors', () => {
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      };

      const message = codec.serialize(
        'another_proto',
        'cross_proto',
        rawData,
      );

      expect(codec.deserialize(2, 0, message.buffer)).toEqual(rawData);
    });
  });
});
