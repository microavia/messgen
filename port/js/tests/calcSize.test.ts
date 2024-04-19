import { describe, it, expect } from 'vitest';
import { FieldStruct } from "../src/Old/Struct";
import { Messages } from "../src/types";
import { Buffer } from "../src/Old/Buffer";

describe('calcSize', () => {
  
  // Calculates the correct size for a simple object with primitive types
  it('должен правильно вычислять размер для простого объекта с примитивными типами', () => {
    const fields: FieldStruct[] = [
      {
        name: "name",
        type: "string"
      },
      {
        name: "age",
        type: "number"
      },
      {
        name: "address",
        type: "string"
      }
    ];
    
    const includeMessages: Messages<string> = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: {
        id: 0,
        size: 0,
        fields: []
      }
    };
    
    const size = Buffer.calcSize(fields, includeMessages);
    
    expect(size).toBe(12);
  });
  
  // Calculates the correct size for an object with nested complex types
  it('должен правильно вычислять размер для объекта с вложенными сложными типами', () => {
    const fields: FieldStruct[] = [
      {
        name: "name",
        type: "string"
      },
      {
        name: "age",
        type: "number"
      },
      {
        name: "address",
        type: "string"
      },
      {
        name: "nested",
        type: "object",
        fields: [
          {
            name: "nestedName",
            type: "string"
          },
          {
            name: "nestedAge",
            type: "number"
          }
        ]
      }
    ];
    
    const includeMessages: Messages<string> = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: {
        id: 0,
        size: 0,
        fields: []
      }
    };
    
    const size = Buffer.calcSize(fields, includeMessages);
    
    expect(size).toBe(24);
  });
  
  // Calculates the correct size for an empty object
  it('должен правильно вычислять размер для пустого объекта', () => {
    const fields: FieldStruct[] = [];
    
    const includeMessages: Messages<string> = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: {
        id: 0,
        size: 0,
        fields: []
      }
    };
    
    const size = Buffer.calcSize(fields, includeMessages);
    
    expect(size).toBe(0);
  });
  
  // Calculates the correct size for an object with null values
  it('должен правильно вычислять размер для объекта со значениями null', () => {
    const fields: FieldStruct[] = [
      {
        name: "name",
        type: "string",
        value: null
      },
      {
        name: "age",
        type: "number",
        value: null
      },
      {
        name: "address",
        type: "string",
        value: null
      }
    ];
    
    const includeMessages: Messages<string> = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: {
        id: 0,
        size: 0,
        fields: []
      }
    };
    
    const size = Buffer.calcSize(fields, includeMessages);
    
    expect(size).toBe(0);
  });
  
  // Calculates the correct size for an object with undefined values
  it('должен правильно вычислять размер для объекта со значениями undefined', () => {
    const fields: FieldStruct[] = [
      {
        name: "name",
        type: "string",
        value: undefined
      },
      {
        name: "age",
        type: "number",
        value: undefined
      },
      {
        name: "address",
        type: "string",
        value: undefined
      }
    ];
    
    const includeMessages: Messages<string> = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: {
        id: 0,
        size: 0,
        fields: []
      }
    };
    
    const size = Buffer.calcSize(fields, includeMessages);
    
    expect(size).toBe(0);
  });
  
});
