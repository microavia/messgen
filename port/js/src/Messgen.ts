import { HEADER_STRUCT } from "./HEADER_STRUCT";
import { Messages, SchemaObj, ProtocolJSON, IType, TypeClass, Types, EnumTypeClass } from "./types";
import { BasicConverter } from "./converters/BasicConverter";
import { Converter } from "./converters/Converter";
import { StructConverter } from "./converters/StructConverter";
import { NestedConverter } from "./converters/NestedConverter";
import { Buffer } from "./Buffer";
import { EnumConverter } from "./converters/EnumConverter";
import { topologicalSort } from "./utils/topologicalSort";


export class Messgen {
  private includeMessages: Messages
  private HEADER_STRUCT: StructConverter;
  
  constructor(
    private protocolJson: ProtocolJSON,
    private headerSchema?: SchemaObj
  ) {
    this.includeMessages = this.initializeMessages(protocolJson);
    
    this.HEADER_STRUCT = new StructConverter(
      'head',
      headerSchema ? headerSchema : HEADER_STRUCT,
      this.includeMessages.converters
    )
    
  }
  
  private initializeMessages(
    protocolJson: ProtocolJSON,
  ) {
    
    const map = new Map<IType, Converter>(
      BasicConverter.fromGlobalConfigs()
    )
    let res = {
      typesMap: new Map<number, Converter>(),
      converters: map,
    } satisfies Messages;
    
    Messgen.sortingTypesByDependency(protocolJson.types).forEach(([k, v]) => {
      switch (v.type_class) {
        case "struct":
          v.fields?.forEach((field) => {
            if (field.type.includes("[") || field.type.includes("{")) {
              res.converters.set(field.type, new NestedConverter(
                field.type,
                map
              ));
            }
          })
          res.converters.set(k as IType,
            new StructConverter(
              k,
              v,
              map
            )
          );
          break;
        
        case "enum":
          res.converters.set(k as IType,
            new EnumConverter(
              k,
              v,
              map
            )
          );
          break;
      }
    })
    
    Object.entries<IType>(protocolJson.types_map).map(([k, v]) => ({
      id: Number(k),
      name: v.trim() as IType
    })).forEach((m) => {
      
      let converter = map.get(m.name);
      if (!converter) {
        throw new Error(`Converter for type ${m.name} is not found `);
      }
      res.typesMap.set(m.id, converter);
    })
    
    
    return res;
  }
  
  serializeMessage(message: Record<string, any>) {
    // TODO: implement
  }
  
  deserializeMessage(message: ArrayBufferLike) {
    // TODO: implement
  }
  
  serialize(type: IType, obj: Record<string, any>) {
    
    let convertor = this.includeMessages.converters.get(type);
    if (!convertor) {
      throw new Error(`Converter for type ${type} is not found `);
    }
    let buffer = new Buffer(
      new ArrayBuffer(
        convertor.size(obj)
      )
    )
    convertor?.serialize(obj, buffer)
    
    return buffer;
  }
  
  deserialize(type: IType, arrayBuffer: ArrayBufferLike) {
    let convertor = this.includeMessages.converters.get(type);
    if (!convertor) {
      throw new Error(`Converter for type ${type} is not found `);
    }
    let buffer = new Buffer(arrayBuffer)
    
    return convertor.deserialize(buffer)
  }
  
  
  static initializeBasicConverter() {
    return new Map<IType, Converter>(
      BasicConverter.fromGlobalConfigs()
    )
  }
  
  static sortingTypesByDependency(json: Types): [IType, TypeClass | EnumTypeClass][] {
    // Create a graph
    let graph: { [key: string]: string[] } = {};
    for (let typeName in json) {
      graph[typeName] = [];
      let jsonElement = json[typeName];
      if (jsonElement.type_class === "struct") {
        jsonElement.fields?.forEach((field) => {
          let dependencyName = field.type.replace(/(\[|\{).+/g, "");
          if (json[dependencyName]) {
            graph[typeName].push(dependencyName);
          }
        });
      }
    }
    // Perform topological sort
    let sortedTypeNames = topologicalSort(graph)
    
    // Map sorted type names back to their corresponding type classes
    let sortedTypes = sortedTypeNames.map((typeName) => [typeName, json[typeName]] as [IType, TypeClass | EnumTypeClass]);
    
    return sortedTypes;
  }
  
  
}
