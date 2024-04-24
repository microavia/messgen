import { describe, it, expect, vi } from 'vitest';
import { BasicConverter, BasicTypesConfig, basicTypes } from "../src/converters/BasicConverter";
import { Buffer } from "../src/Buffer";

const jest = vi

describe('PrimitiveConverter', () => {
  
  it('Should correctly return the size of the serialized value', () => {
    // Given
    const config: BasicTypesConfig = {
      name: 'string',
      size: jest.fn(),
      read: jest.fn(),
      write: jest.fn(),
    };
    const converter = new BasicConverter(config);
    const value = 'test value';
    
    // When
    const result = converter.size(value);
    
    // Then
    expect(config.size).toHaveBeenCalledWith(value);
  });
  
  it('Should correctly serialize and deserialize a value', () => {
    // Given
    const config: BasicTypesConfig = basicTypes.find(type => type.name === 'int8')!
    
    const converter = new BasicConverter(config);
    const value = 3;
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    buffer.dataView.setInt8(0, value);
    
    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const deserializedValue = converter.deserialize(buffer);
    
    // Then
    expect(deserializedValue).toBe(value);
  });
  
  it('Should correctly deserialize values of different sizes from the same buffer', () => {
    // Given
    const config1: BasicTypesConfig = basicTypes.find(type => type.name === 'int8')!
    const config2: BasicTypesConfig = basicTypes.find(type => type.name === 'int16')!
    const converter1 = new BasicConverter(config1);
    const converter2 = new BasicConverter(config2);
    const value1 = 3;
    const value2 = 1000;
    const buffer = new Buffer(new ArrayBuffer(converter1.size(value1) + converter2.size(value2)));
    buffer.dataView.setInt8(0, value1);
    buffer.dataView.setInt16(1, value2);
    
    // When
    converter1.serialize(value1, buffer);
    converter2.serialize(value2, buffer);
    buffer.offset = 0;
    const deserializedValue1 = converter1.deserialize(buffer);
    const deserializedValue2 = converter2.deserialize(buffer);
    
    // Then
    expect(deserializedValue1).toBe(value1);
    expect(deserializedValue2).toBe(value2);
  });
  
  
  it('Should correctly handle serialization of values of different sizes', () => {
    // Given
    const config1: BasicTypesConfig = basicTypes.find(type => type.name === 'int32')!
    const config2: BasicTypesConfig = basicTypes.find(type => type.name === 'float64')!
    const converter1 = new BasicConverter(config1);
    const converter2 = new BasicConverter(config2);
    const buffer = new Buffer(new ArrayBuffer(12));
    buffer.offset = 0;
    const value1 = 123;
    const value2 = 3.14;
    
    // When
    converter1.serialize(value1, buffer);
    converter2.serialize(value2, buffer);
    
    // Then
    expect(buffer.offset).toBe(12);
  });
  
  it('Must correctly serialize and deserialize bytes value', () => {
    // Given
    const config = basicTypes.find(type => type.name === 'bytes')!;
    const converter = new BasicConverter(config);
    const value = new Uint8Array([1, 2, 3, 4]);
    const buffer = new Buffer(new ArrayBuffer(
      converter.size(value)
    ));
    
    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const result = converter.deserialize(buffer);
    
    // Then
    expect(result).toEqual(value);
  });
});
