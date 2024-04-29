import {
  Messages,
  ProtocolJSON,
  IType,
  TypeClass,
  Types,
  EnumTypeClass,
  IProtocolId,
  IProtocolName,
  IName,
  IValue
} from "./types";
import { GlobalBasicConverters } from "./converters/BasicConverter";
import { Converter } from "./converters/Converter";
import { StructConverter } from "./converters/StructConverter";
import { NestedConverter } from "./converters/NestedConverter";
import { Buffer } from "./Buffer";
import { EnumConverter } from "./converters/EnumConverter";
import { topologicalSort } from "./utils/topologicalSort";
import { IHeaderConverter, headerConverter, IHeaderNames } from "./HEADER_STRUCT";


export class Messgen {
  private includeMessages: Map<IProtocolId, Messages> = new Map();
  private protocolNameToId: Record<IProtocolName, IProtocolId>;
  
  constructor(
    private protocolJson: ProtocolJSON[],
    private headerConvertor: IHeaderConverter = headerConverter
  ) {
    
    this.protocolNameToId = Object.fromEntries(
      protocolJson.map(({ proto_id, proto_name }) => [proto_name, proto_id])
    )
    
    protocolJson.sort((a, b) => a.proto_id - b.proto_id).forEach((protocolJson) => {
      console.log(protocolJson.proto_name);
      this.includeMessages.set(
        protocolJson.proto_id,
        this.initializeMessages(protocolJson)
      )
    })
    
  }
  
  // TODO: rename to enum?
  serializeMessage(protocolName: IProtocolName, type: IName, obj: IValue, headerObj: Record<string, any> = {}): ArrayBufferLike {
    let protocolMessages = this.includeMessages.get(this.protocolNameToId[protocolName]);
    if (!protocolMessages) {
      throw new Error(`Protocol ${protocolName} is not found `);
    }
    
    let convertor = protocolMessages.converters.get(type);
    
    if (!convertor) {
      throw new Error(`Converter for type ${type} is not found `);
    }
    
    let messageSize = convertor.size(obj);
    let headObj = {
      message_id: protocolMessages.typesNameToId[type],
      protocol_id: this.protocolNameToId[protocolName],
      size: messageSize,
      ...headerObj
    }
    let size = messageSize + this.headerConvertor.size(headObj)
    let buffer = new Buffer(
      new ArrayBuffer(size)
    )
    this.headerConvertor.serialize(headObj, buffer)
    convertor?.serialize(obj, buffer)
    
    return buffer.buffer;
    
  }
  
  deserializeMessage(message: ArrayBufferLike): (IValue & {
    __HEADER__: Record<IHeaderNames | string, number>
  }) {
    let res = []
    let buffer = new Buffer(message)
    while (buffer.offset < buffer.size) {
      
      let header = this.headerConvertor.deserialize(buffer)
      let protocolMessages = this.includeMessages.get(header.protocol_id);
      if (!protocolMessages) {
        throw new Error(`Protocol ${header.protocol_id} is not found `);
      }
      
      let messageConverter = protocolMessages.typesMap.get(header.message_id);
      if (!messageConverter) {
        throw new Error(`Message ${header.message_id} is not found in ${header.protocol_id}`);
      }
      
      let data = messageConverter.deserialize(buffer)
      data.__HEADER__ = header
      res.push(data)
    }
    
    return res
  }
  
  serialize(protocolName: IProtocolName, type: IType, obj: Record<string, any>) {
    let protocolMessages = this.includeMessages.get(this.protocolNameToId[protocolName]);
    if (!protocolMessages) {
      throw new Error(`Protocol ${protocolName} is not found `);
    }
    
    let convertor = protocolMessages.converters.get(type);
    
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
  
  deserialize(protocolName: IProtocolName, type: IType, arrayBuffer: ArrayBufferLike) {
    let protocolMessages = this.includeMessages.get(this.protocolNameToId[protocolName]);
    if (!protocolMessages) {
      throw new Error(`Protocol ${protocolName} is not found `);
    }
    let convertor = protocolMessages.converters.get(type);
    if (!convertor) {
      throw new Error(`Converter for type ${type} is not found `);
    }
    let buffer = new Buffer(arrayBuffer)
    
    return convertor.deserialize(buffer)
  }
  
  
  initializeMessages(
    protocolJson: ProtocolJSON,
  ) {
    const map = new Map<IType, Converter>(
      GlobalBasicConverters
    )
    let res = {
      protocol: protocolJson,
      typesMap: new Map<number, Converter>(),
      converters: map,
      typesNameToId: Object.fromEntries(
        Object.entries<IType>(protocolJson.types_map ?? {}).map(([k, v]) => [v.trim(), Number(k)])
      )
    } satisfies Messages;
    
    Messgen.sortingTypesByDependency(protocolJson.types).forEach(([k, v]) => {
      switch (v.type_class) {
        case "struct":
          v.fields?.forEach((field) => {
            
            // cors
            if (field.type.includes("/")) {
              let regex = /(.*\/)([^{\[]*)/;
              let match = regex.exec(field.type);
              if (!match) {
                throw new Error(`Type ${field.type} is not valid `);
              }
              let protocolName: IProtocolName = match[1].slice(0, -1)
              let typeName: IName = match[2];
              
              let protocolMessages = this.includeMessages.get(this.protocolNameToId[protocolName]);
              if (!protocolMessages) {
                throw new Error(`Protocol ${protocolName} is not found `);
              }
              
              let typeConverter = protocolMessages.converters.get(typeName);
              if (!typeConverter) {
                throw new Error(`Converter for type ${typeName} is not found in ${protocolName}`);
              }
              res.converters.set(field.type, typeConverter)
            }
            
            // nested
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
    
    Object.entries<IType>(protocolJson.types_map ?? {}).map(([k, v]) => ({
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
  
  
  static initializeBasicConverter() {
    return new Map<IType, Converter>(
      GlobalBasicConverters
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
