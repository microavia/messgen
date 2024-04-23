import { HEADER_STRUCT } from "./HEADER_STRUCT";
import { Messages, SchemaObj, IName, ProtocolJSON, IType, TypeClass, Types, EnumTypeClass } from "./types";
import { BasicConverter } from "./converters/BasicConverter";
import { Converter } from "./converters/Converter";
import { StructConverter } from "./converters/StructConverter";
import { NestedConverter } from "./converters/NestedConverter";
import { Buffer } from "./Buffer";


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
    
    const map = Messgen.initializeBasicConverter();
    let res = {
      typesMap: new Map<number, Converter>(),
      converters: map,
    } satisfies Messages;
    
    Messgen.sortingTypesByDependency(protocolJson.types).forEach(([k, v]) => {
      switch (v.type_class) {
        case "struct":
          v.fields.forEach((field) => {
            if (field.type.includes("[") || field.type.includes("{")) {
              res.converters.set(field.type, new NestedConverter(
                field.type,
                map
              ));
            }
          })
          
          res.converters.set(k as IType,
            new StructConverter(
              k as IName,
              v,
              map
            )
          );
        case "enum":
          throw new Error("Enum is not supported yet");
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
    return Object.entries(json).sort((a, b) => {
      
      let weightA = 0
      let weightB = 0
      let nameA = a[0]
      let nameB = b[0]
      let typeA = a[1]
      let typeB = b[1]
      
      switch (typeA.type_class) {
        case "struct":
          weightA = Number(typeA.fields.some((field) => {
            return field.type.replace(
              /(\[|\{).+/g,
              ""
            ) === nameB
          }))
          break;
        case "enum":
          weightA = -2
          break;
      }
      
      switch (typeB.type_class) {
        case "struct":
          weightB = Number(typeB.fields.some((field) => {
            return field.type.replace(
              /(\[|\{).+/g,
              ""
            ) === nameA
          }))
          break;
        case "enum":
          weightB = -2
          break;
      }
      
      if (
        weightA === 1 &&
        weightB === 1
      ) {
        throw new Error(`Circular dependency between ${nameA} and ${nameB}`);
      }
      
      return weightA - weightB;
    })
  }
  
  
}
