import { describe, it, expect } from 'vitest';
import { EnumConverter } from "../src/converters/EnumConverter";
import { EnumTypeDefinition, EnumValue, IBasicType } from "../src/types";
import { Buffer } from "../src/Buffer";
import { initGetType } from './utils';

describe('EnumConverter', () => {
  it('should serialize single valued enum', () => {
    const value = 1;
    const converter = intiEnumConverter([{ name: 'Value1', value }])
    const buffer = new Buffer(new ArrayBuffer(2));

    converter.serialize(value, buffer);

    expect(buffer.offset).toBe(1);
  });

  it('should deserialize single value enum', () => {
    const value = 1;
    const converter = intiEnumConverter([{ name: 'Value1', value }])
    const buffer = new Buffer(new ArrayBuffer(2));

    converter.serialize(value, buffer);
    buffer.offset = 0;
    const result = converter.deserialize(buffer);

    expect(result).toBe(value);
  });


  it('should serialize  multiple values enum', () => {
    const converter = intiEnumConverter([
      { name: 'VALUE1', value: 1 },
      { name: 'VALUE2', value: 2 },
      { name: 'VALUE3', value: 3 }
    ])
    const buffer = new Buffer(new ArrayBuffer(2));

    converter.serialize('value2', buffer);

    expect(buffer.offset).toEqual(1);
  });

  it('should return size for enum value', () => {
    const value = 1;
    const converter = intiEnumConverter([{ name: 'Value1', value }], 'int32')

    const result = converter.size(value);

    expect(result).toEqual(4);
  });


  function intiEnumConverter(values: EnumValue[], type?: IBasicType): EnumConverter {
    const schema = createSchema(values, type);
    const getType = initGetType();
    return new EnumConverter('testStruct', schema, getType);
  }

  function createSchema(values: EnumValue[] = [], type: IBasicType = 'int8'): EnumTypeDefinition {
    return { typeClass: 'enum', values, typeName: 'testStruct', type };
  }


})
