import { describe, it, expect } from 'vitest';
import { ConverterFactory } from "../src/converters/ConverterFactory";
import { IType } from "../src/types";
import { Converter } from "../src/converters/Converter";
import { Buffer } from "../src/Buffer";
import { Protocols } from '../src/converters/Protocols';

describe('ConverterFactory', () => {
  it('should serialize scalar correctly', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    converter.serialize(value, buffer);

    expect(buffer.offset).toBe(4);
  });

  it('should deserialize scalar type type', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toBe(value);
  });

  it('should serialize sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(12);
  });

  it('should deserializie sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });

  it('should throw an error when the basis type is not found in the converters map', () => {
    expect(() => getConverter('customType')).toThrowError('Unknown type: customType not found at protocol test');
  });

  it('should throw an error when the map key type is not found in the converters map', () => {
    expect(() => { getConverter('int32{customType}') }).toThrowError(`Unknown type: customType not found at protocol test`);
  });

  it('should serialize multidimensional array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [
      new Int32Array([1, 2, 3]),
      new Int32Array([4, 5, 4]),
    ];
    const size = converter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(24);
  });

  it('should deserialize multidimensional array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [
      new Int32Array([1, 2, 3]),
      new Int32Array([4, 5, 4]),
    ];
    const size = converter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });


  it('should serialize map of scalar typess', () => {
    const converter = getConverter('string{int32}');
    const value = new Map<number, string>([
      [1, "one"],
      [2, "two"],
      [3, "three"]
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(39);
  });


  it('should serialize and deserialize a map of basic types correctly', () => {
    const converter = getConverter('string{int32}');
    const value = new Map<number, string>([
      [1, "one"],
      [2, "two"],
      [3, "three"]
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).is.deep.eq(value);
  });



  it('should calculate the correct size for flat array', () => {
    const converter = getConverter('int32[5]');
    const value = new Int32Array([1, 2, 3, 4, 5]);

    expect(converter.size(value)).toBe(4 * 5);
  });

  it('should calculate size for nested array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [Int32Array.from([1, 2, 3]), Int32Array.from([4, 5, 6])];

    expect(converter.size(value)).toBe(24);
  });

  it('should throw an error for unknown map key type', () => {
    const serializeFn = () => getConverter('int32{undefined}');

    expect(serializeFn).toThrowError('Unknown type: undefined not found at protocol test');
  });


  it('should throw an error when the array length is out of bounds', () => {
    const converter = getConverter('int32[3]');
    const value = [1, 2, 3, 4]; // Array length is out of bounds
    const serialize = () => converter.serialize(value, new Buffer(new ArrayBuffer(converter.size(value))));

    expect(serialize).toThrowError('Array length mismatch: 4 !== 3');
  });


  it('it should serialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ["key1", new Map<string, Int32Array[]>([
        ["key2", [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]
      ])]
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    expect(buffer.offset).toEqual(buffer.size);
  });

  it('it should deserialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ["key1", new Map<string, Int32Array[]>([
        ["key2", [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]
      ])]
    ]);

    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });

  function getConverter(type: IType): Converter {
    const factory = new ConverterFactory(new Protocols([]));
    return factory.toConverter('test', type);
  }
});
