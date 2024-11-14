import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { Types, ProtocolJSON, } from "../src/types";
import { ProtocolManager } from "../src/protocol/ProtocolManager";

let testProtoData: ProtocolJSON;
let anotherProtoData: ProtocolJSON;
describe('ProtocolManager', () => {
  beforeAll(() => {
    execSync(' npm run gen-json')
    const protocolPath = path.resolve(__dirname, './messgen/test_proto/protocol.json');
    const rawData = fs.readFileSync(protocolPath);
    // @ts-ignore
    testProtoData = JSON.parse(rawData);

    const anotherProtocolPath = path.resolve(__dirname, './another_proto/protocol.json');
    const anotherRawData = fs.readFileSync(anotherProtocolPath);
    // @ts-ignore
    anotherProtoData = JSON.parse(anotherRawData);
  })

  describe('sortingTypesByDependency', () => {
    it('shopuld sort array of entries based on their dependencies', () => {
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
      const result = ProtocolManager.getSortedTypesByDependency(json);

      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });

    it('should return empty array when the input is an empty object', () => {
      // Given
      const json: Types = {};

      // When
      const result = ProtocolManager.getSortedTypesByDependency(json);

      // Then
      expect(result).toEqual([]);
    });

    it.skip('should throw an error if object has circular depth', () => {
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
      const sortingTypesByDependency = () => ProtocolManager.getSortedTypesByDependency(json);

      // Then
      expect(sortingTypesByDependency).toThrowError("Circular dependency between type2 and type1");
    });


    it('should filter out objects without dependencies', () => {
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
      const result = ProtocolManager.getSortedTypesByDependency(json);

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
      const result = ProtocolManager.getSortedTypesByDependency(json);

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
    const result = ProtocolManager.getSortedTypesByDependency(json);

    // Then
    expect(result).toEqual([
      ["type2", json.type2],
      ["type1", json.type1]
    ]);
  });
});
