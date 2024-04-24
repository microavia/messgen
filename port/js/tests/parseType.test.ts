import { parseType } from "../src/parseType";
import { describe, it, expect } from 'vitest';
import { Messages, IName, IType } from "../src/types";
import { Struct } from "../src/Struct";
import { HEADER_STRUCT } from "../src/HEADER_STRUCT";


describe('parseType', () => {
  let includeMessages = {
    __id__: [0],
    __name__: ['MyType'],
    __messages__: {
      MyType: new Struct(
        {
          id: 0,
          fields: [
            { name: "field1", type: "int8" },
            { name: "field2", type: "int16" },
            { name: "field3", type: "int32" },
            { name: "field4", type: "int64" },
            { name: "field5", type: "int32" }
          ]
        }
      ),
    },
    HEADER_STRUCT: HEADER_STRUCT,
  } as unknown as Messages<string>;
  
  it('Should correctly parse a simple primitive type without array notation', () => {
    // Given
    const typeStr = 'int8';
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'primitive',
      typeIndex: 0,
      typeSize: 1,
      wrapper: []
    });
  });
  
  it('Should correctly parse a simple primitive type with array notation', () => {
    const typeStr = 'int32[5]';
    
    const result = parseType(typeStr, includeMessages);
    
    expect(result).toEqual(
      {
        variant: 'primitive',
        typeIndex: 4,
        typeSize: 4,
        wrapper: [
          {
            variant: 'array',
            length: 5
          }
        ]
      }
    );
  });
  it('Should correctly parse a simple primitive type with array notation', () => {
    const typeStr = 'int32[5]{int32}';
    
    const result = parseType(typeStr, includeMessages);
    
    expect(result).toEqual(
      {
        variant: 'primitive',
        typeIndex: 4,
        typeSize: 4,
        wrapper: [
          {
            variant: 'array',
            length: 5
          },
          {
            variant: 'map',
            keyType: 'int32',
            keyTypeSize: 4
          }
        ]
      }
    );
  });
  
  it('Should throw an error when encountering an unknown type', () => {
    expect(() => {
      // @ts-ignore
      parseType('UnknownType', includeMessages);
    }).toThrowError('Unknown type: UnknownType, if is complex type you must define before the struct.');
  });
  
  it('Should correctly parse a simple complex type without array notation and with includeMessages parameter', () => {
    // Given
    const typeStr = 'MyType' as IType;
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: []
    });
  });
  
  it('Should correctly parse a simple complex type with array notation and with includeMessages parameter', () => {
    // Given
    const typeStr = "MyType[10]";
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: [
        {
          variant: 'array',
          length: 10
        }
      ]
    });
  });
  
  it('Should correctly parse a simple primitive type with array notation and a length of 0', () => {
    const typeStr = "int8[0]";
    
    
    const result = parseType(typeStr, includeMessages);
    
    expect(result).toEqual({
      variant: 'primitive',
      typeIndex: 0,
      typeSize: 1,
      wrapper: [
        {
          variant: 'array',
          length: 0
        }
      ]
    });
  });
  
  //
  it('Must correctly parse a simple primitive type with array notation and length 1', () => {
    // Given
    const typeStr = "int8[1]";
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'primitive',
      typeIndex: 0,
      typeSize: 1,
      wrapper: [
        {
          variant: 'array',
          length: 1
        }
      ]
    });
  });
  
  it('Should correctly parse a simple complex type with array notation and a length of 0 and with includeMessages parameter', () => {
    // Given
    const typeStr = "MyType[0]";
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: [
        {
          variant: 'array',
          length: 0
        }
      ]
    });
  });
  
  it('Should throw an error when encountering a complex type without includeMessages parameter', () => {
    expect(() => {
      // @ts-ignore
      parseType('ComplexType', undefined);
    }).toThrowError('Unknown type: ComplexType, if is complex type you must define before the struct.');
  });
  
  it('Should correctly parse a simple complex type with array notation and a length of 1 and with includeMessages parameter', () => {
    // Given
    const typeStr = "MyType[1]";
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: [
        {
          variant: 'array',
          length: 1
        }
      ]
    });
  });
  
  it('Should throw an error when encountering an unknown type with array notation', () => {
    // Given
    const typeStr = "UnknownType[5]";

    
    // When
    const parseTypeWrapper = () => parseType(typeStr, includeMessages);
    
    // Then
    expect(parseTypeWrapper).toThrowError("Unknown type: UnknownType, if is complex type you must define before the struct.");
  });


  it('Should correctly parse a simple complex type with array notation and with a SubType and with includeMessages parameter', () => {
    // Given
    const typeStr = "MyType[10][20][30]";
    
    // When
    const result = parseType(typeStr, includeMessages);
    
    // Then
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: [
        {
          variant: 'array',
          length: 10
        },
        {
          variant: 'array',
          length: 20
        },
        {
          variant: 'array',
          length: 30
        }
      ]
    });
  });
  it('should throw an error when an unknown type is encountered', () => {
    // Given
    const typeStr = 'int32[5]{invalidType}';
    
    // Then
    expect(() => {
      // When
      parseType(typeStr, includeMessages);
    }).toThrowError(`Unknown type: invalidType, if is complex type you must define before the struct.`);
  });
  
  it('Must correctly parse complex type with multiple massive and cartographic notations', () => {
    const typeStr = 'MyType[10]{int32}[5]';
    
    const result = parseType(typeStr, includeMessages);
    
    expect(result).toEqual({
      variant: 'complex',
      struct: includeMessages.__messages__.MyType,
      typeSize: 19,
      wrapper: [
        {
          variant: 'array',
          length: 10
        },
        {
          variant: 'map',
          keyType: 'int32',
          keyTypeSize: 4
        },
        {
          variant: 'array',
          length: 5
        }
      ]
    });
  });
  
  it('Must correctly parse a simple primitive type using array notation nested in map', () => {
    const typeStr = 'int32[5]{int32}';
    
    const result = parseType(typeStr, includeMessages);
    
    expect(result).toEqual(
      {
        variant: 'primitive',
        typeIndex: 4,
        typeSize: 4,
        wrapper: [
          {
            variant: 'array',
            length: 5
          },
          {
            variant: 'map',
            keyType: 'int32',
            keyTypeSize: 4
          }
        ]
      }
    );
  });
});
