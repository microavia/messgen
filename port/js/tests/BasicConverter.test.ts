import { describe, it, expect, vi } from 'vitest';
import { BasicConverter } from "../src/converters/BasicConverter";
import { Buffer } from "../src/Buffer";
import { BasicTypesConfig } from "../src/types";

const jest = vi

describe('PrimitiveConverter', () => {
  
  // Should correctly return the size of a serialized value
  it('Должен корректно возвращать размер сериализованного значения', () => {
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
  
  // Should correctly serialize and deserialize a value
  it('Должен корректно сериализовать и десериализовать значение', () => {
    // Given
    const config: BasicTypesConfig = {
      name: "int8",
      size: () => 1,
      read: (v, s) => v.getInt8(s),
      write: (v, s, a) => {
        v.setInt8(s, a);
        return 1;
      }
    };
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
  
  it('Должен корректно возвращать размер сериализованного значения', () => {
    // Given
    const config: BasicTypesConfig = {
      name: "int8",
      size: () => 1,
      read: (v, s) => v.getInt8(s),
      write: (v, s, a) => {
        v.setInt8(s, a);
        return 1;
      }
    };
    const converter = new BasicConverter(config);
    const value = 3;
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    buffer.dataView.setInt8(0, value);
    
    // When
    converter.serialize(value, buffer);
    buffer.offset = 0;
    const serializedSize = converter.size(value);
    
    // Then
    expect(serializedSize).toBe(buffer.size);
  });
  it('Должен корректно десериализовать значения разных размеров', () => {
    // Given
    const config1: BasicTypesConfig = {
      name: "int8",
      size: () => 1,
      read: (v, s) => v.getInt8(s),
      write: (v, s, a) => {
        v.setInt8(s, a);
        return 1;
      }
    };
    const config2: BasicTypesConfig = {
      name: "int16",
      size: () => 2,
      read: (v, s) => v.getInt16(s),
      write: (v, s, a) => {
        v.setInt16(s, a);
        return 2;
      }
    };
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
  
  
  it('Должен корректно обрабатывать сериализацию значений разных размеров', () => {
    // Given
    const config1: BasicTypesConfig = {
      name: 'int32',
      size: (value: any) => 4,
      read: (v: DataView, byteOffset: number) => v.getInt32(byteOffset),
      write: (v: DataView, byteOffset: number, value: any) => {
        v.setInt32(byteOffset, value);
        return 4;
      },
    };
    const config2: BasicTypesConfig = {
      name: 'float32',
      size: (value: any) => 8,
      read: (v: DataView, byteOffset: number) => v.getFloat64(byteOffset),
      write: (v: DataView, byteOffset: number, value: any) => {
        v.setFloat64(byteOffset, value);
        return 8;
      },
    };
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
});
