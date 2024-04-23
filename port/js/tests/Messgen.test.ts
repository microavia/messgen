import { describe, it, expect } from 'vitest';
import { Messgen } from "../src/Messgen";
import { Types } from "../src/types";


describe('Messgen', () => {
  describe('sortingTypesByDependency', () => {
    
    // Returns a sorted array of entries based on their dependencies.
    it('должен возвращать отсортированный массив записей на основе их зависимостей', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2",
              name: "field1"
            },
            {
              type: "type3",
              name: "field2"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            {
              type: "type3",
              name: "field1"
            }
          ]
        },
        type3: {
          type_class: "struct",
          fields: []
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
    
    // Returns an empty array when the input is an empty object.
    it('должен возвращать пустой массив, когда входной объект пустой', () => {
      // Given
      const json: Types = {};
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([]);
    });
    
    // Throws an error when the input has circular dependencies.
    it('должен выбрасывать ошибку, когда входные данные имеют циклические зависимости', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2",
              name: "field1"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            { type: "type1", name: "field1" }
          ]
        }
      };
      
      // When
      const sortingTypesByDependency = () => Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(sortingTypesByDependency).toThrowError("Circular dependency between type2 and type1");
    });
    
    
    // Returns an array with entries sorted by their dependencies, when some entries have dependencies that are not defined in the input.
    it('должен возвращать массив с записями, отсортированными по их зависимостям, когда некоторые записи имеют зависимости, которые не определены во входных данных', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            { type: "type2", name: "field1" }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            { type: "type3", name: "field1" }
          ]
        },
        type3: {
          type_class: "struct",
          fields: [
            { type: "type4", name: "field1" }
          ]
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
    it('должен возвращать отсортированный массив записей на основе их зависимостей', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2[]{int32}",
              name: "field1"
            },
            {
              type: "type3",
              name: "field2"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            {
              type: "type3",
              name: "field1"
            }
          ]
        },
        type3: {
          type_class: "struct",
          fields: []
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
  });
  it('должен добавить тесты для полей типом EnumTypeClass', () => {
    // Given
    const json: Types = {
      type1: {
        type_class: "struct",
        fields: [
          { type: "type2", name: "field1" }
        ]
      },
      type2: {
        "type_class": "enum",
        "base_type": "uint8",
        "values": [
          {
            "name": "one_value",
            "value": 0,
          },
          {
            "name": "another_value",
            "value": 1,
          }
        ]
      }
    };
    
    // When
    const result = Messgen.sortingTypesByDependency(json);
    
    // Then
    expect(result).toEqual([
      ["type2", json.type2],
      ["type1", json.type1]
    ]);
  });
});
