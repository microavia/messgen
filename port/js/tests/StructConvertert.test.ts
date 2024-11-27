import { describe, it, expect } from 'vitest';
import type { Field, StructTypeDefinition } from '../src/types';
import { StructConverter } from '../src/converters/base/StructConverter';
import { Buffer } from '../src/Buffer';
import { initGetType } from './utils';

describe('StructConverter', () => {
  it('should serializes an object', () => {
    const structConverter = createStructConverter([{ name: 'field1', type: 'string' }]);
    const buffer = new Buffer(new ArrayBuffer(10));

    const serializeFn = () => structConverter.serialize({ field1: 'value1' }, buffer);

    expect(serializeFn).not.toThrow();
  });

  it('should updates the buffer offset', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int8' },
    ]);
    const value = { field1: 'value1', field2: 123 };
    const buffer = new Buffer(new ArrayBuffer(structConverter.size(value)));

    structConverter.serialize(value, buffer);

    expect(buffer.offset).toBe(11);
  });

  it('should serializes an object with multiple fields in the schema', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int8' },
      { name: 'field3', type: 'bool' },
    ]);
    const buffer = new Buffer(new ArrayBuffer(100));

    const serialize = () => structConverter.serialize({ field1: 'value1', field2: 123, field3: true }, buffer);

    expect(serialize).not.toThrow();
  });

  it('should calculates size of input object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const result = structConverter.size({});

    expect(result).toBe(0);
  });

  it('should serializes an object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const serializedSize = structConverter.size({});
    const buffer = new Buffer(new ArrayBuffer(serializedSize));

    structConverter.serialize({}, buffer);

    expect(serializedSize).toBe(0);
  });

  it('should deserializes input object with an empty schema', () => {
    const structConverter = createStructConverter([]);
    const serializedSize = structConverter.size({});
    const buffer = new Buffer(new ArrayBuffer(serializedSize));

    structConverter.serialize({}, buffer);
    const deserialized = structConverter.deserialize(buffer);

    expect(deserialized).toEqual({});
  });

  it('should calculates the size of an input object based on the schema', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int8' },
      { name: 'field3', type: 'bool' },
    ]);
    const inputObject = { field1: 'value1', field2: 123, field3: true };

    const result = structConverter.size(inputObject);

    expect(result).toBe(12);
  });

  it('serializes an input object with a schema containing reserved field names', () => {
    const structConverter = createStructConverter([
      { name: 'name', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'comment', type: 'string' },
    ]);
    const value = { name: 'John', type: 'Employee', comment: 'This is a test' };
    const buffer = new Buffer(new ArrayBuffer(100));

    structConverter.serialize(value, buffer);

    expect(buffer.offset).toBeGreaterThan(0);
  });

  it('should throws an error if a converter for a field type is not found', () => {
    const createConverterFn = () => createStructConverter([{ name: 'field', type: 'unknownType' }]);

    expect(createConverterFn).toThrowError();
  });

  it('should throws an error if a required field is missing in the input object', () => {
    const structConverter = createStructConverter([
      { name: 'existingField', type: 'string' },
      { name: 'missingField', type: 'string' },
    ]);
    const buffer = new Buffer(new ArrayBuffer(100));
    const inputObject = { existingField: 'existingValue' };

    const serializeFn = () => structConverter.serialize(inputObject, buffer);

    expect(serializeFn).toThrowError('Field missingField is not found in testStruct');
  });

  it('should throws an error when input object contains null or undefined values for required fields', () => {
    const structConverter = createStructConverter([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'int32' },
      { name: 'field3', type: 'bool' },
    ]);
    const value = { field1: null, field2: undefined, field3: true };
    const buffer = new Buffer(new ArrayBuffer(10));

    const serializeFn = () => structConverter.serialize(value, buffer);

    expect(serializeFn).toThrowError('Field field1 is not found in testStruct');
  });

  it('should handles input object with reserved prototype method names as fields', () => {
    const serializeFn = () => createStructConverter([
      { name: 'toString', type: 'string' },
      { name: 'valueOf', type: 'int32' },
      { name: 'hasOwnProperty', type: 'bool' },
    ]);

    expect(serializeFn).toThrow();
  });

  function createStructConverter(
    fields: Field[],
  ): StructConverter {
    const schema = createSchema(fields);
    const getType = initGetType();
    return new StructConverter('testStruct', schema, getType);
  }

  function createSchema(fields: Field[] = []): StructTypeDefinition {
    return { typeClass: 'struct', fields, typeName: 'testStruct' };
  }
});
