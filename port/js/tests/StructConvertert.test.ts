import { describe, it, expect, vi } from 'vitest';
import { TypeClass, Field } from "../src/types";
import { Converter } from "../src/converters/Converter";
import { StructConverter } from "../src/converters/StructConverter";
import { Buffer } from "../src/Buffer";
import { initializeBasicConverter } from './utils';

describe('StructConverter', () => {
  it('should serializes an object', () => {
    const structConverter = createStructConverter([{ name: 'field1', type: 'string' }]);
    const buffer = new Buffer(new ArrayBuffer(10));

    const serializeFn = () => structConverter.serialize({ field1: 'value1' }, buffer);

    expect(serializeFn).not.toThrow();
  })

  it('should updates the buffer offset', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int8' },
    ]);
    const value = { field1: 'value1', field2: 123 };
    const buffer = new Buffer(new ArrayBuffer(structConverter.size(value)));

    // When
    structConverter.serialize(value, buffer);

    // Then
    expect(buffer.offset).toBe(11);
  });

  it('should serializes an object with multiple fields in the schema', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int8' },
      { name: 'field3', type: 'bool' },
    ]);
    const buffer = new Buffer(new ArrayBuffer(100));

    // When
    const serialize = () => structConverter.serialize({ field1: "value1", field2: 123, field3: true }, buffer);

    // Then
    expect(serialize).not.toThrow();
  });

  it('should calculates size of input object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const result = structConverter.size({});

    // Then
    expect(result).toBe(0);
  });

  it('should serializes an object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const serializedSize = structConverter.size({});
    const buffer = new Buffer(new ArrayBuffer(serializedSize));

    // When
    structConverter.serialize({}, buffer);

    // Then
    expect(serializedSize).toBe(0);
  });

  it('should deserializes input object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const serializedSize = structConverter.size({});
    const buffer = new Buffer(new ArrayBuffer(serializedSize));

    // When
    structConverter.serialize({}, buffer);
    const deserialized = structConverter.deserialize(buffer);

    // Then
    expect(deserialized).toEqual({});
  });

  it('should serializes an input object with a nested schema', () => {
    const schema = createSchema([
      { name: "field1", type: "string" },
      { name: "field2", type: "int32" },
      { name: "field3", type: "bool" },
      { name: "field4", type: "nestedStruct" }
    ]);
    const nestedConverter = createStructConverter([
      { name: "nestedField1", type: "string" },
      { name: "nestedField2", type: "int32" }
    ]);
    const converters = initializeBasicConverter();
    converters.set("nestedStruct", nestedConverter);
    const structConverter = new StructConverter("testStruct", schema, converters);
    const buffer = new Buffer(new ArrayBuffer(100));

    // When
    const serialize = () => structConverter.serialize({
      field1: "value1",
      field2: 123,
      field3: true,
      field4: {
        nestedField1: "nestedValue1",
        nestedField2: 456
      }
    }, buffer);

    // Then
    expect(serialize).not.toThrow();
  });

  it('should calculates the size of an input object based on the schema', () => {
    const structConverter = createStructConverter([
      { name: "field1", type: "string" },
      { name: "field2", type: "int8" },
      { name: "field3", type: "bool" }
    ]);
    const inputObject = { field1: "value1", field2: 123, field3: true };

    // When
    const result = structConverter.size(inputObject);

    // Then
    expect(result).toBe(12);
  });

  it('serializes an input object with a schema containing reserved field names', () => {
    const structConverter = createStructConverter([
      { name: "name", type: "string" },
      { name: "type", type: "string" },
      { name: "comment", type: "string" }
    ]);
    const value = { name: "John", type: "Employee", comment: "This is a test" };
    const buffer = new Buffer(new ArrayBuffer(100));

    // When
    structConverter.serialize(value, buffer);

    // Then
    expect(buffer.offset).toBeGreaterThan(0);
  });


  it('should throws an error if a converter for a field type is not found', () => {
    // When
    const createConverterFn = () => createStructConverter([{ name: "field", type: "unknownType" }]);;

    // Then
    expect(createConverterFn).toThrowError();
  });

  it('should throws an error if a required field is missing in the input object', () => {
    const structConverter = createStructConverter([
      { name: "existingField", type: "string" },
      { name: "missingField", type: "string" }
    ]);
    const buffer = new Buffer(new ArrayBuffer(100));
    const inputObject = { existingField: 'existingValue' };

    // When
    const serializeFn = () => structConverter.serialize(inputObject, buffer);

    // Then
    expect(serializeFn).toThrowError("Field missingField is not found in testStruct");
  });

  it('should throws an error when input object contains null or undefined values for required fields', () => {
    const structConverter = createStructConverter([
      { name: "field1", type: "string" },
      { name: "field2", type: "int32" },
      { name: "field3", type: "bool" }
    ]);
    const value = { field1: null, field2: undefined, field3: true };
    const buffer = new Buffer(new ArrayBuffer(10));

    // When
    const serializeFn = () => structConverter.serialize(value, buffer);

    // Then
    expect(serializeFn).toThrowError("Field field1 is not found in testStruct");
  });

  it('should handles input object with reserved prototype method names as fields', () => {
    // When
    const serializeFn = () => createStructConverter([
      { name: "toString", type: "string" },
      { name: "valueOf", type: "int32" },
      { name: "hasOwnProperty", type: "bool" }
    ]);

    // Then
    expect(serializeFn).toThrow();
  });

  function createStructConverter(
    fields: Field[],
    converters: Map<string, Converter> = initializeBasicConverter()
  ): StructConverter {
    const schema = createSchema(fields);
    return new StructConverter('testStruct', schema, converters);
  }

  function createSchema(fields: Field[] = []): TypeClass {
    return { type_class: 'struct', fields };
  }
});
