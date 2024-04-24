import { describe, it, expect, vi } from 'vitest';
import { TypeClass, IType } from "../src/types";
import { Converter } from "../src/converters/Converter";
import { StructConverter } from "../src/converters/StructConverter";
import { Buffer } from "../src/Buffer";
import { Messgen } from "../src/Messgen";


describe('StructConverter', () => {
  
  it('Should correctly serialize a valid input object according to the schema', () => {
    // Given
    const name = 'testStruct';
    const schema: TypeClass = {
      type_class: 'struct',
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'int8' },
      ],
    };
    const converters = Messgen.initializeBasicConverter();
    const structConverter = new StructConverter(name, schema, converters);
    const value = {
      field1: 'value1',
      field2: 123,
    };
    const size = structConverter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));
    
    // When
    structConverter.serialize(value, buffer);
    
    // Then
    expect(buffer.offset).toBe(11);
  });
  
  it('Should handle schema with multiple fields', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int8" },
        { name: "field3", type: "bool" }
      ]
    };
    
    const converters = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("struct", schema, converters);
    
    const value = {
      field1: "value1",
      field2: 123,
      field3: true
    };
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    structConverter.serialize(value, buffer);
    
    // Then
    expect(buffer.offset).toBeGreaterThan(0);
  });
  
  it('Should handle empty input object', () => {
    // Given
    const name = "TestStruct";
    const schema: TypeClass = {
      type_class: "struct",
      fields: []
    };
    const converters = new Map();
    const structConverter = new StructConverter(name, schema, converters);
    const value = {};
    
    // When
    const result = structConverter.size(value);
    
    // Then
    expect(result).toBe(0);
  });
  
  it('Should handle empty schema', () => {
    // Given
    const name = "TestStruct";
    const schema: TypeClass = {
      type_class: "struct",
      fields: []
    };
    const converters = Messgen.initializeBasicConverter();
    const structConverter = new StructConverter(name, schema, converters);
    
    // When
    const serializedSize = structConverter.size({});
    const buffer = new Buffer(new ArrayBuffer(serializedSize));
    structConverter.serialize({}, buffer);
    const deserialized = structConverter.deserialize(buffer);
    
    // Then
    expect(serializedSize).toBe(0);
    expect(deserialized).toEqual({});
  });
  
  it('Should handle schema with one field', () => {
    // Given
    const fieldName = 'field1';
    const fieldType = 'string';
    const fieldValue = 'test value';
    const schema: TypeClass = {
      type_class: 'struct',
      fields: [
        {
          name: fieldName,
          type: fieldType,
        },
      ],
    };
    const converters = new Map();
    const converterMock = {
      serialize: vi.fn(),
      serializeSize: vi.fn(),
      deserialize: vi.fn(),
    };
    converters.set(fieldType, converterMock);
    const bufferMock = new Buffer(new ArrayBuffer(10));
    const structConverter = new StructConverter('TestStruct', schema, converters);
    
    // When
    structConverter.serialize({ [fieldName]: fieldValue }, bufferMock);
    
    // Then
    expect(converterMock.serialize).toHaveBeenCalledWith(fieldValue, bufferMock);
  });
  
  it('Should handle nested schema', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        {
          name: "field1",
          type: "string"
        },
        {
          name: "field2",
          type: "int32"
        },
        {
          name: "field3",
          type: "bool"
        },
        {
          name: "field4",
          type: "shemaNested"
        }
      
      ]
    };
    const shemaNested: TypeClass = {
      type_class: "struct",
      fields: [
        {
          name: "nestedField1",
          type: "string"
        },
        {
          name: "nestedField2",
          type: "int32"
        }
      ]
    }
    
    
    const converters = Messgen.initializeBasicConverter();
    converters.set("shemaNested", new StructConverter("shemaNested", shemaNested, converters));
    const structConverter = new StructConverter("struct", schema, converters);
    
    const value = {
      field1: "value1",
      field2: 123,
      field3: true,
      field4: {
        nestedField1: "nestedValue1",
        nestedField2: 456
      }
    };
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    structConverter.serialize(value, buffer);
    
    // Then
    expect(buffer.offset).toBeGreaterThan(0);
  });
  
  it('Should correctly return the size of a valid input object according to the schema', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int8" },
        { name: "field3", type: "bool" }
      ]
    };
    
    const converters: Map<IType, Converter> = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("TestStruct", schema, converters);
    
    const inputObject = {
      field1: "value1", // 6 bytes + 4 for length
      field2: 123, // 1 byte
      field3: true // 1 byte
    };
    
    // When
    const result = structConverter.size(inputObject);
    
    // Then
    expect(result).toBe(12);
  });
  
  
  it('Should handle schema with reserved field names', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "name", type: "string" },
        { name: "type", type: "string" },
        { name: "comment", type: "string" }
      ]
    };
    
    const converters = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("TestStruct", schema, converters);
    
    const value = {
      name: "John",
      type: "Employee",
      comment: "This is a test"
    };
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    structConverter.serialize(value, buffer);
    
    // Then
    expect(buffer.offset).toBeGreaterThan(0);
  });
  
  it('Should correctly deserialize a valid input buffer according to the schema', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "float64" },
        { name: "field3", type: "bool" }
      ]
    };
    
    const converters: Map<IType, Converter> = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("TestStruct", schema, converters);
    
    
    const inputBuffer = new Buffer(new ArrayBuffer(structConverter.size({
      field1: "test",
      field2: 3.14,
      field3: true
    })));
    
    converters.get("string")?.serialize("test", inputBuffer);
    converters.get("float64")?.serialize(3.14, inputBuffer);
    converters.get("bool")?.serialize(true, inputBuffer);
    inputBuffer.offset = 0;
    
    // When
    const result = structConverter.deserialize(inputBuffer);
    
    // Then
    expect(result).toEqual({
      field1: "test",
      field2: 3.14,
      field3: true
    });
  });
  
  it('Should handle schema with default values for fields', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int32" },
        { name: "field3", type: "bool", comment: "This is a field" },
      ],
    };
    
    const converters = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("TestStruct", schema, converters);
    
    const value = {
      field1: "value1",
      field2: 123,
      field3: true,
    };
    
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    structConverter.serialize(value, buffer);
    
    // Then
    expect(buffer.offset).toBeGreaterThan(0);
  });
  
  it('Should handle schema with duplicate field names', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int32" },
        { name: "field1", type: "bool" },
      ],
    };
    
    const converters = Messgen.initializeBasicConverter();
    
    expect(() => new StructConverter("TestStruct", schema, converters)).toThrowError("Field field1 is duplicated in TestStruct");
    
  });
  
  it('Should handle input object with extra fields not defined in the schema', () => {
    // Given
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int32" }
      ]
    };
    
    const converters = Messgen.initializeBasicConverter();
    
    const structConverter = new StructConverter("TestStruct", schema, converters);
    
    const inputObject = {
      field1: "value1",
      field2: 123,
      extraField: "extraValue"
    };
    
    const buffer = new Buffer(new ArrayBuffer(structConverter.size(inputObject)));
    
    // When
    const serializeFn = () => structConverter.serialize(inputObject, buffer);
    
    // Then
    expect(serializeFn).not.toThrow();
  });
  
  
  it('Should throw an error if a converters for a field type is not found', () => {
    // Given
    const fieldName = "field";
    const fieldType = "unknownType";
    const fieldValue = "value";
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        {
          name: fieldName,
          type: fieldType,
        },
      ],
    };
    const converters = Messgen.initializeBasicConverter();
    
    // When
    const serializeFn = () => new StructConverter("struct", schema, converters);
    
    // Then
    expect(serializeFn).toThrowError(`Converter for type ${fieldType} is not found`);
  });
  
  it('Should throw an error if a field is missing in the input object', () => {
    // Given
    const fieldName = 'missingField';
    const fieldValue = 'value';
    const inputObject = {
      existingField: 'existingValue'
    };
    const schema: TypeClass = {
      type_class: 'struct',
      fields: [
        {
          name: 'existingField',
          type: 'string'
        },
        {
          name: fieldName,
          type: 'string'
        }
      ]
    };
    const converters = Messgen.initializeBasicConverter();
    const converter = new StructConverter('TestStruct', schema, converters);
    const buffer = new Buffer(new ArrayBuffer(100));
    
    // When
    const serializeFn = () => converter.serialize(inputObject, buffer);
    
    // Then
    expect(serializeFn).toThrowError(`Field ${fieldName} is not found in TestStruct`);
  });
  
  it('Should handle input object with null or undefined values', () => {
    // Given
    const name = "TestStruct";
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "field1", type: "string" },
        { name: "field2", type: "int32" },
        { name: "field3", type: "bool" }
      ]
    };
    const converters = Messgen.initializeBasicConverter();
    
    
    const structConverter = new StructConverter(name, schema, converters);
    const value = {
      field1: null,
      field2: undefined,
      field3: true
    };
    const buffer = new Buffer(new ArrayBuffer(10));
    
    // When
    const serializeFn = () => structConverter.serialize(value, buffer);
    
    // Then
    expect(serializeFn).toThrowError(`Field field1 is not found in ${name}`);
  });
  
  it('Should handle input object with null or undefined values', () => {
    // Given
    const name = "TestStruct";
    const schema: TypeClass = {
      type_class: "struct",
      fields: [
        { name: "toString", type: "string" },
        { name: "valueOf", type: "int32" },
        { name: "hasOwnProperty", type: "bool" }
      ]
    };
    const converters = Messgen.initializeBasicConverter();
    
    
    // When
    const serializeFn = () =>
      new StructConverter(name, schema, converters);
    
    // Then
    expect(serializeFn).toThrow();
  });
});
