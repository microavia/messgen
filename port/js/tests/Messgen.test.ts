import { describe, it, expect } from 'vitest';
import { Messgen } from "../src/Messgen";
import { Types } from "../src/types";


describe('Messgen', () => {
  describe('sortingTypesByDependency', () => {
    
    it('Returns a sorted array of entries based on their dependencies.', () => {
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
    
    it('Returns an empty array when the input is an empty object.', () => {
      // Given
      const json: Types = {};
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([]);
    });
    
    it('Throws an error when the input has circular dependencies.', () => {
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
    
    
    it('Returns an array with entries sorted by their dependencies, when some entries have dependencies that are not defined in the input.', () => {
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
    it('should return a sorted array of entries based on their dependencies', () => {
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
  it('should add tests for fields of EnumTypeClass', () => {
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
