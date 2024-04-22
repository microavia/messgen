import { describe, it, expect, vi } from 'vitest';
import { NestedConverter } from "../src/NestedConverter";
import { IType } from "../src/types";
import { Converter } from "../src/Converter";
import { Buffer } from "../src/Buffer";
import { Messgen } from "../src/messgen";
import { DYNAMIC_SIZE_TYPE, basicTypes } from "../src/constants";
import { PrimitiveConverter } from "../src/PrimitiveConverter";

const jest = vi

describe('NestedConverter', () => {
  
  // should serialize and deserialize a basic type correctly
  it('должен сериализовать и десериализовать базовый тип правильно', () => {
    // Given
    const name = 'int32';
    const converters = Messgen.initializePrimitiveConverter();
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
  
  // should serialize and deserialize an array of basic types correctly
  it('должен сериализовать и десериализовать массив базовых типов правильно', () => {
    // Given
    const name = 'int32[3]';
    const converters = Messgen.initializePrimitiveConverter();
    const converter = new NestedConverter(name, converters);
    const value = [1, 2, 3];
    const buffer = new Buffer(new ArrayBuffer(12));
    
    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const result = converter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should throw an error when the basis type is not found in the converters map
  it('должен выбросить ошибку, когда базовый тип не найден в карте конвертеров', () => {
    // Given
    const name = 'customType';
    const converters = Messgen.initializePrimitiveConverter();
    
    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);
    }).toThrowError(`Unknown type: ${name}, if is complex type you must define before the struct.`);
  });
  
  // should throw an error when the dynamic size type is not found in the converters map
  it('должен выбросить ошибку, когда динамический размер типа не найден в карте конвертеров', () => {
    // Given
    const name = 'int32[5]{int32}';
    const converters = new Map<IType, Converter>();
    converters.set('int32', new PrimitiveConverter(basicTypes.find((type) => type.name === 'int32')!))
    
    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);
      
    }).toThrowError(`Converter for type ${DYNAMIC_SIZE_TYPE} is not found in ${name}`);
  });
  
  // should throw an error when the map key type is not found in the converters map
  it('должен выбросить ошибку, когда тип ключа карты не найден в карте конвертеров', () => {
    // Given
    const name = 'int32{customType}';
    const converters = Messgen.initializePrimitiveConverter();
    
    // When, Then
    expect(() => {
      const converter = new NestedConverter(name, converters);
      converter.serialize({ key: 42 }, new Buffer(new ArrayBuffer(4)));
    }).toThrowError(`Unknown type: customType, if is complex type you must define before the struct.`);
  });
  
  // should serialize and deserialize an array of dynamic length correctly
  it('Должен сериализовать и десериализовать массив переменной длины правильно', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const nestedConverter = new NestedConverter(`int32[][]`, converters);
    const value = [[1, 2, 3], [4, 5], [6, 7, 8, 9]];
    const size = nestedConverter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should serialize and deserialize a nested array of dynamic length correctly
  it('Должен сериализовать и десериализовать вложенный массив переменной длины правильно', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const nestedConverter = new NestedConverter("int32[3][]", converters);
    const value = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
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
    const converters = Messgen.initializePrimitiveConverter();
    const nestedConverter = new NestedConverter("int32{string}", converters);
    const buffer = new Buffer(new ArrayBuffer(8));
    const value = { 1: "one", 2: "two", 3: "three" };
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  
  // should serialize and deserialize a nested map of basic types correctly
  it('Должен сериализовать и десериализовать вложенную карту базовых типов правильно', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const int32Converter = new Converter("int32");
    const stringConverter = new Converter("string");
    converters.set("int32", int32Converter);
    converters.set("string", stringConverter);
    
    const nestedConverter = new NestedConverter("int32{string}", converters);
    const buffer = new Buffer(new ArrayBuffer(8));
    
    const value = {
      1: "one",
      2: "two",
      3: "three"
    };
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should serialize and deserialize a nested array of basic types correctly
  it('Должен сериализовать и десериализовать вложенный массив базовых типов правильно', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const int32Converter = new Converter("int32");
    converters.set("int32", int32Converter);
    const nestedConverter = new NestedConverter("int32[2][3]", converters);
    const buffer = new Buffer(new ArrayBuffer(24));
    const value = [[1, 2, 3], [4, 5, 6]];
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should calculate the correct size for a basic type
  it('Должен правильно вычислять размер для базового типа', () => {
    // Given
    const name = 'int32';
    const converters = Messgen.initializePrimitiveConverter();
    const converter = new NestedConverter(name, converters);
    const value = 42;
    
    // When
    const size = converter.size(value);
    
    // Then
    expect(size).toBe(4);
  });
  
  // should calculate the correct size for an array of basic types
  it('должен правильно вычислять размер для массива базовых типов', () => {
    // Given
    const name = 'int32[5]';
    const converters = Messgen.initializePrimitiveConverter();
    const converter = new Converter(name);
    converters.set(name, converter);
    const nestedConverter = new NestedConverter(name, converters);
    const value = [1, 2, 3, 4, 5];
    const expectedSize = 20;
    
    // When
    const size = nestedConverter.size(value);
    
    // Then
    expect(size).toBe(expectedSize);
  });
  
  // should calculate the correct size for a nested array of basic types
  it('Должен правильно вычислять размер для вложенного массива базовых типов', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const int32Converter = new Converter("int32");
    converters.set("int32", int32Converter);
    const nestedConverter = new NestedConverter("int32[3][2]", converters);
    const value = [[1, 2, 3], [4, 5, 6]];
    
    // When
    const size = nestedConverter.size(value);
    
    // Then
    expect(size).toBe(24);
  });
  
  // should throw an error when the map key type is undefined
  it('должен выбросить ошибку, когда тип ключа карты не определен', () => {
    // Given
    const name = 'int32{undefined}';
    const converters = Messgen.initializePrimitiveConverter();
    const nestedConverter = new NestedConverter(name, converters);
    
    // When
    const serializeFn = () => nestedConverter.serialize({}, new Buffer(new ArrayBuffer(10)));
    
    // Then
    expect(serializeFn).toThrowError('Invalid map key type: undefined');
  });
  
  // should throw an error when the buffer offset is out of bounds
  it('должен выбросить ошибку, когда смещение буфера выходит за границы', () => {
    // Given
    const name = 'int32';
    const converters = Messgen.initializePrimitiveConverter();
    const converter = new Converter(name);
    converters.set(name, converter);
    const nestedConverter = new NestedConverter(name, converters);
    const value = { value: 10 };
    const buffer = new Buffer(new ArrayBuffer(10));
    buffer.offset = 11; // Set offset beyond buffer size
    
    // When
    const serialize = () => nestedConverter.serialize(value, buffer);
    
    // Then
    expect(serialize).toThrowError('Buffer offset is out of bounds');
  });
  
  // should throw an error when the array length is out of bounds
  it('должен выбросить ошибку, когда длина массива выходит за границы', () => {
    // Given
    const name = 'int32[3]';
    const converters = Messgen.initializePrimitiveConverter();
    const converter = new NestedConverter(name, converters);
    const value = [1, 2, 3, 4]; // Array length is out of bounds
    
    // When
    const serialize = () => converter.serialize(value, new Buffer(new ArrayBuffer(10)));
    
    // Then
    expect(serialize).toThrowError('Buffer offset is out of bounds');
  });
  
  // should support nested maps with dynamic size arrays
  it('Должен поддерживать вложенные карты с массивами динамического размера', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const int32Converter = new Converter("int32");
    const uint32Converter = new Converter("uint32");
    converters.set("int32", int32Converter);
    converters.set("uint32", uint32Converter);
    const nestedConverter = new NestedConverter("int32[5]{uint32}", converters);
    const buffer = new Buffer(new ArrayBuffer(20));
    const value = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]];
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should support nested maps with nested arrays
  it('Должен поддерживать вложенные карты с вложенными массивами', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    
    
    const nestedArrayConverter = new NestedConverter("int32[3]", converters);
    const nestedMapConverter = new NestedConverter("string{int32[2]}", converters);
    
    const nestedConverter = new NestedConverter("string{int32[2]{int32[3]}}", converters);
    
    const value = {
      key1: {
        key2: [
          [1, 2, 3],
          [4, 5, 6]
        ]
      }
    };
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
  
  // should support nested arrays with nested maps
  it('должен поддерживать вложенные массивы с вложенными картами', () => {
    // Given
    const converters = Messgen.initializePrimitiveConverter();
    const int32Converter = new Converter("int32");
    const stringConverter = new Converter("string");
    converters.set("int32", int32Converter);
    converters.set("string", stringConverter);
    
    const nestedMapConverter = new NestedConverter("string{int32}", converters);
    const nestedArrayConverter = new NestedConverter("int32[3]{string{int32}}", converters);
    
    const nestedMapValue = {
      "key1": 1,
      "key2": 2,
      "key3": 3
    };
    
    const nestedArrayValue = [
      {
        "key1": 1,
        "key2": 2,
        "key3": 3
      },
      {
        "key1": 4,
        "key2": 5,
        "key3": 6
      },
      {
        "key1": 7,
        "key2": 8,
        "key3": 9
      }
    ];
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    nestedMapConverter.serialize(nestedMapValue, buffer);
    const deserializedMapValue = nestedMapConverter.deserialize(buffer);
    
    nestedArrayConverter.serialize(nestedArrayValue, buffer);
    const deserializedArrayValue = nestedArrayConverter.deserialize(buffer);
    
    // Then
    expect(deserializedMapValue).toEqual(nestedMapValue);
    expect(deserializedArrayValue).toEqual(nestedArrayValue);
  });
  
  it('should throw an error when the map key type converter is not found', () => {
    const converters = new Map<IType, Converter>();
    const typeStr = 'int32{int32}';
    expect(() => new NestedConverter(typeStr, converters)).toThrow(`Unknown type: int32, if is complex type you must define before the struct.`);
  });
  
  it('should support nested arrays with dynamic size maps', () => {
    const converters = Messgen.initializePrimitiveConverter();
    const typeStr = 'int32[5]{int32}';
    const nestedConverter = new NestedConverter(typeStr, converters);
    const buffer = new Buffer(new ArrayBuffer(100));
    const value = [1, 2, 3, 4, 5];
    nestedConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = nestedConverter.deserialize(buffer);
    expect(result).toEqual(value);
  });
});
