import { describe, it, expect, beforeEach } from 'vitest';
import { parseType, ParseTypedArrayType } from '../src/utils/parseType';
import { Converter } from '../src/converters/Converter';
import { IType } from '../src/types';

describe('parseType', () => {
  class MockConverter extends Converter {
    name = 'mock';
    typedArray = Float32Array;
    serialize() { }
    deserialize() { }
    size() { return 4; }
  }

  class StringConverter extends Converter {
    name = 'string';
    serialize() { }
    deserialize() { }
    size() { return 4; }
  }

  let converters: Map<IType, Converter>;

  beforeEach(() => {
    converters = new Map();
    converters.set('mock', new MockConverter('mock'));
    converters.set('string', new StringConverter('string'));
  });

  describe('::base', () => {
    it('should parse simple type without wrappers', () => {
      const result = parseType('mock', converters);

      expect(result.converter).toBeInstanceOf(MockConverter);
      expect(result.wrapper).toHaveLength(0);
    });

    it('should throw error for unknown type', () => {
      expect(() => parseType('unknown', converters))
        .toThrow('Unknown type: unknown');
    });

    it('should throw error for invalid type array type', () => {
      expect(() => parseType('[]', converters))
        .toThrow('Invalid type string, no base type found');
    });

    it('should throw error for invalid type map type', () => {
      expect(() => parseType('{}', converters))
        .toThrow('Invalid type string, no base type found');
    });
  });

  describe('::array', () => {
    it('should parse fixed-size array', () => {
      const result = parseType('mock[5]', converters);

      expect(result.converter).toBeInstanceOf(MockConverter);
      expect(result.wrapper).toHaveLength(1);
      expect(result.wrapper[0]).toEqual({
        variant: 'typed-array',
        length: 5,
        elementType: 'mock',
        TypedArray: Float32Array
      });
    });

    it('should parse dynamic-size array', () => {
      const result = parseType('mock[]', converters);

      expect(result.wrapper).toHaveLength(1);
      expect(result.wrapper[0]).toEqual({
        variant: 'typed-array',
        length: undefined,
        elementType: 'mock',
        TypedArray: Float32Array
      });
    });

    it('should parse nested arrays', () => {
      const result = parseType('mock[3][2]', converters);

      expect(result.wrapper).toHaveLength(2);
      expect(result.wrapper[0]).toEqual({
        variant: 'typed-array',
        length: 3,
        elementType: 'mock',
        TypedArray: Float32Array
      });
      expect(result.wrapper[1]).toEqual({
        variant: 'array',
        length: 2,
        elementType: 'mock'
      });
    });

    it('should throw error for invalid array syntax', () => {
      expect(() => parseType('mock[', converters))
        .toThrow('Invalid array syntax');
    });
  });

  describe('map parsing', () => {
    it('should parse simple map', () => {
      const result = parseType('mock{string}', converters);

      expect(result.wrapper).toHaveLength(1);
      expect(result.wrapper[0]).toEqual({
        variant: 'map',
        keyType: 'string',
        valueType: 'string',
        converter: converters.get('string')
      });
    });

    it('should throw error for invalid map syntax', () => {
      expect(() => parseType('mock{', converters))
        .toThrow('Invalid map syntax');
    });

    it('should throw error for unknown key type', () => {
      expect(() => parseType('mock{unknown}', converters))
        .toThrow('Unknown type: unknown');
    });
  });

  describe('complex type combinations', () => {
    it('should parse array of maps', () => {
      const result = parseType('mock{string}[3]', converters);

      expect(result.wrapper).toHaveLength(2);
      expect(result.wrapper[0]).toEqual({
        variant: 'map',
        keyType: 'string',
        valueType: 'string',
        converter: converters.get('string')
      });
      expect(result.wrapper[1]).toEqual({
        variant: 'array',
        length: 3,
        elementType: 'mock'
      });
    });

    it('should parse map with array values', () => {
      const result = parseType('mock[3]{string}', converters);

      expect(result.wrapper).toHaveLength(2);
      expect(result.wrapper[0]).toEqual({
        variant: 'typed-array',
        length: 3,
        elementType: 'mock',
        TypedArray: Float32Array
      });
      expect(result.wrapper[1]).toEqual({
        variant: 'map',
        keyType: 'string',
        valueType: 'string',
        converter: converters.get('string')
      });
    });
  });

  describe('error cases', () => {
    it('should throw error for invalid characters in type string', () => {
      expect(() => parseType('mock@', converters)).toThrow('Unknown type: mock@');
    });

    it('should throw error for incomplete type definition', () => {
      expect(() => parseType('mock[3', converters)).toThrow('Invalid array syntax');
    });

    it('should throw error for invalid array length', () => {
      expect(() => parseType('mock[a]', converters)).toThrow('Invalid array syntax');
    });
  });

  describe('::typed-array', () => {
    it('should create typed array wrapper for base types with typedArray property', () => {
      const result = parseType('mock[3]', converters);

      expect(result.wrapper[0].variant).toBe('typed-array');
      expect(result.wrapper[0]).toHaveProperty('TypedArray');
    });

    it('should create regular array wrapper for non-typed array types', () => {
      const result = parseType('string[3]', converters);

      expect(result.wrapper[0].variant).toBe('array');
      expect(result.wrapper[0]).not.toHaveProperty('TypedArray');
    });
  });
});