import { describe, it, expect, vi } from 'vitest';
import { NestedConverter, DYNAMIC_SIZE_TYPE } from "../src/converters/NestedConverter";
import { IType } from "../src/types";
import { Converter } from "../src/converters/Converter";
import { Buffer } from "../src/Buffer";
import { BasicConverter, basicTypes } from "../src/converters/BasicConverter";
import { initializeBasicConverter } from './utils';

describe('NestedConverter', () => {

  it('should serialize and deserialize a basic type correctly', () => {
    // Given
    const name = 'int32';
    const converters = initializeBasicConverter();
    const converter = new NestedConverter(name, converters);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const result = converter.deserialize(buffer);

    // Then
    expect(result).toBe(value);
  });

  it('should serialize and deserialize an array of basic types correctly', () => {
    // Given
    const name = 'int32[3]';
    const converters = initializeBasicConverter();
    const converter = new NestedConverter(name, converters);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const result = converter.deserialize(buffer);

    // Then
    expect(result).toEqual(value);
  });

  it('should throw an error when the basis type is not found in the converters map', () => {
    // Given
    const name = 'customType';
    const converters = initializeBasicConverter();

    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);
    }).toThrowError(`Unknown type: ${name}, if is complex type you must define before the struct.`);
  });

  it('should throw an error when the dynamic size type is not found in the converters map', () => {
    // Given
    const name = 'int32[5]{int32}';
    const converters = new Map<IType, Converter>();
    converters.set('int32', new BasicConverter(basicTypes.find((type) => type.name === 'int32')!))

    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);

    }).toThrowError(`Converter for type ${DYNAMIC_SIZE_TYPE} is not found in ${name}`);
  });

  it('should throw an error when the map key type is not found in the converters map', () => {
    // Given
    const name = 'int32{customType}';
    const converters = initializeBasicConverter();

    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);
      converter.serialize({ key: 42 }, new Buffer(new ArrayBuffer(4)));
    }).toThrowError(`Unknown type: customType, if is complex type you must define before the struct.`);
  });

  it('should serialize and deserialize an array of dynamic length correctly', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter(`int32[][]`, converters);
    const value = [
      new Int32Array([1, 2, 3]),
      new Int32Array([4, 5]),
      new Int32Array([6, 7, 8, 9])
    ];
    const size = nestedConverter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));

    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(result).toEqual(value);
  });

  //
  it('Должен сериализовать и десериализовать вложенный массив переменной длины правильно', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter("int32[3][]", converters);
    const value = [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6]), new Int32Array([7, 8, 9])];
    const size = nestedConverter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));


    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(result).toEqual(value);
  });

  // should serialize and deserialize a map of basic types correctly
  it('should serialize and deserialize a map of basic types correctly', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter("string{int32}", converters);
    const value = new Map<number, string>([
      [1, "one"],
      [2, "two"],
      [3, "three"]
    ]);
    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(value)
    ));


    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(result).is.deep.eq(value);
  });

  it('should serialize and deserialize a map of basic types correctly serialize object', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter("string{int32}", converters);
    const valueObj = {
      1: "one",
      2: "two",
      3: "three"
    };
    const value = new Map<number, string>([
      [1, "one"],
      [2, "two"],
      [3, "three"]
    ]);
    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(valueObj)
    ));


    // When
    nestedConverter.serialize(valueObj, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(result).is.deep.eq(value);
  });


  it('should serialize and deserialize a nested map of basic types correctly', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter("int32{string}", converters);

    const value = new Map<string, number>([
      ["one", 1],
      ["two", 2],
      ["three", 3]
    ]);

    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(value)
    ));


    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(buffer.offset).toEqual(buffer.size);
    expect(result).toEqual(value);
  });

  it('should serialize and deserialize a nested map of basic types correctly', () => {
    // Given
    const converters = initializeBasicConverter();
    const nestedConverter = new NestedConverter("int32{string}", converters);

    const valueObj = {
      one: 1,
      two: 2,
      three: 3
    }
    const value = new Map<string, number>([
      ["one", 1],
      ["two", 2],
      ["three", 3]
    ]);

    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(valueObj)
    ));


    // When
    nestedConverter.serialize(valueObj, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(buffer.offset).toEqual(buffer.size);
    expect(result).toEqual(value);
  });

  it('should serialize and deserialize a nested array of basic types correctly', () => {
    // Given
    const converters = initializeBasicConverter();

    const nestedConverter = new NestedConverter("int32[3][2]", converters);
    const value = [
      new Int32Array([1, 2, 3]),
      new Int32Array([4, 5, 6])
    ];
    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(value)
    ));

    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);

    // Then
    expect(result).toEqual(value);
  });


  it('should calculate the correct size for an array of basic types', () => {
    // Given
    const name = 'int32[5]';
    const converters = initializeBasicConverter();

    const nestedConverter = new NestedConverter(name, converters);
    const value = [1, 2, 3, 4, 5];
    const expectedSize = 4 * 5;

    // When
    const size = nestedConverter.size(value);

    // Then
    expect(size).toBe(expectedSize);
  });

  it('should calculate the correct size for a nested array of basic types', () => {
    // Given
    const converters = initializeBasicConverter();

    const nestedConverter = new NestedConverter("int32[3][2]", converters);
    const value = [[1, 2, 3], [4, 5, 6]];

    // When
    const size = nestedConverter.size(value);

    // Then
    expect(size).toBe(24);
  });

  it('should throw an error when the map key type is undefined', () => {
    // Given
    const name = 'int32{undefined}';
    const converters = initializeBasicConverter();

    // When
    const serializeFn = () => new NestedConverter(name, converters);
    // Then
    expect(serializeFn).toThrowError('Unknown type: undefined, if is complex type you must define before the struct. ');
  });


  it('should throw an error when the array length is out of bounds', () => {
    // Given
    const name = 'int32[3]';
    const converters = initializeBasicConverter();
    const converter = new NestedConverter(name, converters);
    const value = [1, 2, 3, 4]; // Array length is out of bounds

    // When
    const serialize = () => converter.serialize(value, new Buffer(new ArrayBuffer(
      converter.size(value)
    )));

    // Then
    expect(serialize).toThrowError('Array length mismatch: 4 !== 3');
  });


  it('should support nested maps with nested arrays', () => {
    // Given
    const converters = initializeBasicConverter();


    const nestedConverter = new NestedConverter("int32[3][]{string}{string}", converters);

    const value = new Map<string, Map<string, Int32Array[]>>([
      ["key1", new Map<string, Int32Array[]>([
        ["key2", [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]
      ])]
    ]);

    const buffer = new Buffer(new ArrayBuffer(
      nestedConverter.size(value)
    ));

    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    expect(buffer.offset).toEqual(buffer.size);
    // Then
    expect(result).toEqual(value);
  });

  it('should support nested arrays with nested maps', () => {
    // Given
    const converters = initializeBasicConverter();

    const nestedMapConverter = new NestedConverter("int32{string}", converters);
    const nestedArrayMapConverter = new NestedConverter("int32{string}[]", converters);

    const nestedMapValue = new Map<string, number>([
      ["key1", 1],
      ["key2", 2],
      ["key3", 3]
    ])

    const nestedArrayValue = [
      new Map<string, number>([
        ["key1", 1],
        ["key2", 2],
        ["key3", 3]
      ]),
      new Map<string, number>([
        ["key4", 4],
        ["key5", 5],
        ["key6", 6]
      ]),
      new Map<string, number>([
        ["key7", 7],
        ["key8", 8],
        ["key9", 9]
      ])
    ];

    const buffer = new Buffer(new ArrayBuffer(
      nestedMapConverter.size(nestedMapValue) +
      nestedArrayMapConverter.size(nestedArrayValue)
    ));

    // When
    nestedMapConverter.serialize(nestedMapValue, buffer);
    nestedArrayMapConverter.serialize(nestedArrayValue, buffer);

    buffer.offset = 0;

    const deserializedMapValue = nestedMapConverter.deserialize(buffer);
    const deserializedArrayValue = nestedArrayMapConverter.deserialize(buffer);

    // Then
    expect(deserializedMapValue).toEqual(nestedMapValue);
    expect(deserializedArrayValue).toEqual(nestedArrayValue);
  });

  it('should throw an error when the map key type converters is not found', () => {
    const converters = new Map<IType, Converter>();
    const typeStr = 'int32{int32}';
    expect(() => new NestedConverter(typeStr, converters)).toThrow(`Converter for type uint32 is not found in int32{int32}`);
  });

});
