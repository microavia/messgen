import { parseType } from "../src/utils/parseType";
import { describe, it, expect } from 'vitest';
import { IType } from "../src/types";
import { StructConverter } from "../src/converters/StructConverter";
import { initializeBasicConverter } from './utils';


describe('parseType', () => {
  const converters = initializeBasicConverter()
  converters.set('MyType', new StructConverter('MyType', {
    type_class: 'struct',
    fields: [
      {
        name: 'field1',
        type: 'int8'
      },
      {
        name: 'field2',
        type: 'int16'
      },
      {
        name: 'field3',
        type: 'int32'
      },
      {
        name: 'field4',
        type: 'int64'
      },
      {
        name: 'field5',
        type: 'int8'
      },
    ]
  }, converters));


  it('should parse primitive type', () => {
    // Given
    const typeStr = 'int8';

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('int8'),
      wrapper: []
    });
  });

  it('should parse primitive type with array notation', () => {
    const typeStr = 'int32[5]';

    const result = parseType(typeStr, converters);

    expect(result).toEqual(
      {
        converter: converters.get('int32'),
        wrapper: [
          {
            variant: "typed-array",
            TypedArray: Int32Array,
            length: 5
          }
        ]
      }
    );
  });

  it('should parse primitive type with dimensional array notation', () => {
    const typeStr = 'int32[5]{int32}';

    const result = parseType(typeStr, converters);

    expect(result).toEqual({
      converter: converters.get('int32'),
      wrapper: [
        {
          variant: "typed-array",
          TypedArray: Int32Array,
          length: 5
        },
        {
          variant: 'map',
          converter: converters.get('int32'),
        }
      ]
    });
  });

  it('should throw an error when encountering an unknown type', () => {
    const error = 'Unknown type: UnknownType, if is complex type you must define before the struct.';

    expect(() => parseType('UnknownType', converters)).toThrowError(error);
  });

  it('should complex type with converters parameter', () => {
    // Given
    const typeStr = 'MyType' as IType;

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('MyType'),
      wrapper: []
    });
  });

  it('should parse a simple complex type with array notation with converters parameter', () => {
    // Given
    const typeStr = "MyType[10]";

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('MyType'),
      wrapper: [
        {
          variant: 'array',
          length: 10
        }
      ]
    });
  });

  it('should parse a primitive type with array notation with zero length', () => {
    const typeStr = "int8[0]";

    expect(parseType(typeStr, converters)).toEqual({
      converter: converters.get('int8'),
      wrapper: [{
        variant: 'typed-array',
        TypedArray: Int8Array,
        length: 0
      }]
    });
  });

  it('should parse primitive type with array notation and length non zero length', () => {
    expect(parseType("int8[1]", converters)).toEqual({
      converter: converters.get('int8'),
      wrapper: [{
        variant: 'typed-array',
        TypedArray: Int8Array,
        length: 1
      }]
    });
  });

  it('should parsea simple complex type with array notation and a length of 0 and with converters parameter', () => {
    // Given
    const typeStr = "MyType[0]";

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('MyType'),
      wrapper: [
        {
          variant: 'array',
          length: 0
        }
      ]
    });
  });


  it('should parsea simple complex type with array notation and a length of 1 and with converters parameter', () => {
    // Given
    const typeStr = "MyType[1]";

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('MyType'),

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
    const parseTypeWrapper = () => parseType(typeStr, converters);

    // Then
    expect(parseTypeWrapper).toThrowError("Unknown type: UnknownType, if is complex type you must define before the struct.");
  });


  it('should parsea simple complex type with array notation and with a SubType and with converters parameter', () => {
    // Given
    const typeStr = "MyType[10][20][30]";

    // When
    const result = parseType(typeStr, converters);

    // Then
    expect(result).toEqual({
      converter: converters.get('MyType'),

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
      parseType(typeStr, converters);
    }).toThrowError(`Unknown type: invalidType, if is complex type you must define before the struct.`);
  });

  it('should parse complex type with multiple massive and cartographic notations', () => {
    const typeStr = 'MyType[10]{int32}[5]';

    const result = parseType(typeStr, converters);

    expect(result).toEqual({
      converter: converters.get('MyType'),
      wrapper: [
        {
          variant: 'array',
          length: 10
        },
        {
          variant: 'map',
          converter: converters.get('int32'),
        },
        {
          variant: 'array',
          length: 5
        }
      ]
    });
  });

  it('should parse primitive type using array notation nested in map', () => {
    const typeStr = 'int32[5]{int32}';

    const result = parseType(typeStr, converters);

    expect(result).toEqual(
      {
        converter: converters.get('int32'),
        wrapper: [
          {
            variant: 'typed-array',
            TypedArray: Int32Array,
            length: 5
          },
          {
            variant: 'map',
            converter: converters.get('int32'),

          }
        ]
      }
    );
  });

  it('should throw an error when an unknown type is encountered', () => {
    // Given
    const typeStr = 'int32[5]{invalidType}';

    // When, Then
    expect(() => {
      parseType(typeStr, converters);
    }).toThrowError('Unknown type: invalidType, if is complex type you must define before the struct.');
  });

  it('should throw an error when encountering an unknown type with array notation', () => {
    // Given
    const typeStr = 'UnknownType[5]';

    // When, Then
    expect(() => {
      parseType(typeStr, converters);
    }).toThrowError('Unknown type: UnknownType, if is complex type you must define before the struct.');
  });

  it('should throw an error when an unknown type is encountered', () => {
    // Given
    const typeStr = 'UnknownType';

    // When, Then
    expect(() => {
      parseType(typeStr, converters);
    }).toThrowError('Unknown type: UnknownType, if is complex type you must define before the struct.');

  });
});
