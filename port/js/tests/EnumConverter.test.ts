import { describe, it, expect, vi } from 'vitest';
import { EnumConverter } from "../src/converters/EnumConverter";
import { EnumTypeClass } from "../src/types";
import { Buffer } from "../src/Buffer";
import { Converter } from "../src/converters/Converter";
import { initializeBasicConverter } from './utils';

const jest = vi


describe('EnumConverter', () => {

  it('Should correctly serialize and deserialize single value enum values', () => {
    // Given
    const name = 'TestEnum';
    const baseType = 'int8';
    const types: EnumTypeClass = { type_class: 'enum', base_type: baseType, values: [{ name: 'Value1', value: 1 }] };
    const converters = initializeBasicConverter();

    const enumConverter = new EnumConverter(name, types, converters);
    const value = 1;
    const buffer = new Buffer(new ArrayBuffer(10));

    // When
    enumConverter.serialize(value, buffer);
    buffer.offset = 0;
    const result = enumConverter.deserialize(buffer);
    console.log(`:: result =`, result);
    // Then
    expect(result).toBe(value);
  });


  it('Should correctly serialize and deserialize enum values with multiple values', () => {
    // Given
    const name = 'testEnum';
    const baseType = 'int8';
    const values = [
      { name: 'VALUE1', value: 1 },
      { name: 'VALUE2', value: 2 },
      { name: 'VALUE3', value: 3 }
    ];
    const types: EnumTypeClass = {
      type_class: 'enum',
      base_type: baseType,
      values: values
    };
    const converters = new Map();
    const converterMock = {
      serialize: jest.fn(),
      deserialize: jest.fn(),
      size: jest.fn()
    };
    converters.set(baseType, converterMock);
    const enumConverter = new EnumConverter(name, types, converters);
    const value = 'value2';
    const buffer = new Buffer(new ArrayBuffer(10));

    // When
    enumConverter.serialize(value, buffer);

    // Then
    expect(converterMock.serialize).toHaveBeenCalledWith(value, buffer);
  });


  it('Should throw an error if base type converter is not found', () => {
    const name = "test";
    const types: EnumTypeClass = {
      type_class: "enum",
      comment: "test",
      base_type: "int32",
      values: []
    };
    const converters = new Map();

    const serializeFn = () => new EnumConverter(name, types, converters);

    expect(serializeFn).toThrowError(`Converter for type ${types.base_type} is not found in ${name}`);
  });

  it('Should correctly return size of serialized enum value using base type converter', () => {
    // Given
    const name = "testName";
    const baseType = "int32";
    const enumTypeClass: EnumTypeClass = {
      type_class: "enum",
      base_type: baseType,
      values: []
    };
    const converters = initializeBasicConverter();
    const baseTypeConverter: Converter = {
      name: baseType,
      serialize: jest.fn(),
      deserialize: jest.fn(),
      size: jest.fn().mockReturnValue(10),
      default: jest.fn()
    };
    converters.set(baseType, baseTypeConverter);
    const enumConverter = new EnumConverter(name, enumTypeClass, converters);
    const value = 1;

    // When
    const result = enumConverter.size(value);

    // Then
    expect(result).toBe(10);
    expect(baseTypeConverter.size).toHaveBeenCalledWith(value);
  });


  it('Should handle enum values with non-string values', () => {
    const name = 'TestEnum';
    const baseType = 'int8';
    const values = [
      { name: 'VALUE1', value: 1 },
      { name: 'VALUE2', value: 2 },
      { name: 'VALUE3', value: 3 }
    ];
    const types: EnumTypeClass = {
      type_class: 'enum',
      base_type: baseType,
      values: values
    };
    const converters = initializeBasicConverter();
    const converterMock: Converter = {
      name: baseType,
      serialize: jest.fn(),
      deserialize: jest.fn(),
      size: jest.fn(),
      default: jest.fn()
    };
    converters.set(baseType, converterMock);
    const enumConverter = new EnumConverter(name, types, converters);
    const value = 2;

    const buffer = new Buffer(new ArrayBuffer(10));

    enumConverter.serialize(value, buffer);

    expect(converterMock.serialize).toHaveBeenCalledWith(value, buffer);
  });


})
