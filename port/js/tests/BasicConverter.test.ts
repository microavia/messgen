import { describe, it, expect } from 'vitest';
import { BasicConverter, basicTypes, IS_LITTLE_ENDIAN } from "../src/converters/BasicConverter";
import { Buffer } from "../src/Buffer";

describe('BasicConverter', () => {

  describe('::primitive', () => {
    it('should serialize int8', () => {
      const converter = getConverter('int8');
      const buffer = getBuffer(1);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value);
    });

    it('should deserialize int8', () => {
      const value = 3;
      const converter = getConverter('int8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative in8', () => {
      const converter = getConverter('int8');
      const buffer = getBuffer(1);
      const value = -3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value);
    })

    it('should deserialize negative int8', () => {
      const value = -3;
      const converter = getConverter('int8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int16', () => {
      const converter = getConverter('int16');
      const buffer = getBuffer(2);
      const value = 6457;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int16', () => {
      const value = 6457;
      const converter = getConverter('int16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int16', () => {
      const converter = getConverter('int16');
      const buffer = getBuffer(2);
      const value = -6457;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int16', () => {
      const value = -15359;
      const converter = getConverter('int16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int32', () => {
      const converter = getConverter('int32');
      const buffer = getBuffer(4);
      const value = 3123123;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int32', () => {
      const value = 3123123;
      const converter = getConverter('int32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int32', () => {
      const converter = getConverter('int32');
      const buffer = getBuffer(4);
      const value = -323432;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int32', () => {
      const value = -312312;
      const converter = getConverter('int32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int64', () => {
      const converter = getConverter('int64');
      const buffer = getBuffer(8);
      const value = 9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigInt64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int64', () => {
      const value = 9007199254740991n;
      const converter = getConverter('int64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigInt64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int64', () => {
      const converter = getConverter('int64');
      const buffer = getBuffer(8);
      const value = -9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigInt64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int64', () => {
      const value = -9007199254740991n;
      const converter = getConverter('int64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigInt64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint8', () => {
      const converter = getConverter('uint8');
      const buffer = getBuffer(1);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint8(0)).toBe(value);
    });

    it('should deserialize uint8', () => {
      const value = 3;
      const converter = getConverter('uint8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint16', () => {
      const converter = getConverter('uint16');
      const buffer = getBuffer(2);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint16', () => {
      const value = 32332;
      const converter = getConverter('uint16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint32', () => {
      const converter = getConverter('uint32');
      const buffer = getBuffer(4);
      const value = 5646233;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint32', () => {
      const value = 5646233;
      const converter = getConverter('uint32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint64', () => {
      const converter = getConverter('uint64');
      const buffer = getBuffer(8);
      const value = 9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigUint64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint64', () => {
      const value = 9007199254740991n;
      const converter = getConverter('uint64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigUint64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize float32', () => {
      const converter = getConverter('float32');
      const buffer = getBuffer(4);
      const value = 3.2;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getFloat32(0, IS_LITTLE_ENDIAN)).toBeCloseTo(value, 5);
    });

    it('should deserialize float32', () => {
      const value = 31231.14;
      const converter = getConverter('float32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setFloat32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBeCloseTo(value, 2);
    });

    it('should serialize float64', () => {
      const converter = getConverter('float64');
      const buffer = getBuffer(8);
      const value = 3123213.2;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getFloat64(0, IS_LITTLE_ENDIAN)).toBeCloseTo(value, 5);
    });

    it('should deserialize float64', () => {
      const value = 3.14;
      const converter = getConverter('float64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setFloat64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBeCloseTo(value, 5);
    });

    it('should serialize char', () => {
      const converter = getConverter('char');
      const buffer = getBuffer(1);
      const value = 'a';

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value.charCodeAt(0));
    });

    it('should deserialize char', () => {
      const value = 'a';
      const converter = getConverter('char');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value.charCodeAt(0));

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize bool', () => {
      const converter = getConverter('bool');
      const buffer = getBuffer(1);
      const value = true;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(1);
    });

    it('should deserialize bool', () => {
      const value = true;
      const converter = getConverter('bool');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, 1);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize string', () => {
      const value = 'test';
      const converter = getConverter('string');
      const buffer = getBuffer(converter.size(value));

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint32(0, IS_LITTLE_ENDIAN)).toBe(value.length);
      expect(buffer.dataView.getInt8(4)).toBe(value.charCodeAt(0));
    });

    it('should serilize bytes', () => {
      const value = new Uint8Array([1, 2, 3, 4]);
      const converter = getConverter('bytes');
      const buffer = getBuffer(converter.size(value));

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint32(0, IS_LITTLE_ENDIAN)).toBe(value.length);
      expect(buffer.dataView.getUint8(4)).toBe(value[0]);
    });

    it('should deserialize bytes', () => {
      const value = new Uint8Array([1, 2, 3, 4]);
      const converter = getConverter('bytes');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint32(0, value.length, IS_LITTLE_ENDIAN);
      for (let i = 0; i < value.length; i++) {
        buffer.dataView.setUint8(4 + i, value[i]);
      }

      const result = converter.deserialize(buffer);

      expect(result).toEqual(value);
    });
  });

  describe('::size', () => {
    it('should calculate size of int8', () => {
      const converter = getConverter('int8');
      const value = 3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of negative int8', () => {
      const converter = getConverter('int8');
      const value = -3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of int16', () => {
      const converter = getConverter('int16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of negative int16', () => {
      const converter = getConverter('int16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of int32', () => {
      const converter = getConverter('int32');
      const value = 322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of negative int32', () => {
      const converter = getConverter('int32');
      const value = -322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of int64', () => {
      const converter = getConverter('int64');
      const value = 322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of negative int64', () => {
      const converter = getConverter('int64');
      const value = -322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of uint8', () => {
      const converter = getConverter('uint8');
      const value = 3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of uint16', () => {
      const converter = getConverter('uint16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of uint32', () => {
      const converter = getConverter('uint32');
      const value = 322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of uint64', () => {
      const converter = getConverter('uint64');
      const value = 322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of float32', () => {
      const converter = getConverter('float32');
      const value = 3233.14;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of float64', () => {
      const converter = getConverter('float64');
      const value = 3233.14;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of char', () => {
      const converter = getConverter('char');
      const value = 'a';

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of bool', () => {
      const converter = getConverter('bool');
      const value = true;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of string', () => {
      const converter = getConverter('string');
      const value = 'test';

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of bytes', () => {
      const converter = getConverter('bytes');
      const value = new Uint8Array([1, 2, 3, 4]);

      const result = converter.size(value);

      expect(result).toBe(8);
    });
  })

  it('should deserialize multiple types from the same buffer', () => {
    const value1 = 3; // int8
    const value2 = 1000; // int16
    const converter1 = getConverter('int8');
    const converter2 = getConverter('int16');
    const buffer = getBuffer(converter1.size(value1) + converter2.size(value2));
    converter1.serialize(value1, buffer);
    converter2.serialize(value2, buffer);
    buffer.offset = 0;

    const deserializedValue1 = converter1.deserialize(buffer);
    const deserializedValue2 = converter2.deserialize(buffer);

    expect(deserializedValue1).toBe(value1);
    expect(deserializedValue2).toBe(value2);
  });

  function getConverter(name: string) {
    return new BasicConverter(basicTypes.find(type => type.name === name)!);
  }

  function getBuffer(size: number) {
    return new Buffer(new ArrayBuffer(size));
  }
});
