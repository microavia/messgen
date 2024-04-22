import { HEADER_STRUCT } from "./HEADER_STRUCT";
import { Messages, SchemaObj, IName, ProtocolJSON, IType, BasicTypesConfig, TypeClass } from "./types";
import { PrimitiveConverter } from "./PrimitiveConverter";
import { basicTypes } from "./constants";
import { Converter } from "./Converter";
import { StructConverter } from "./StructConverter";

//
// /**
//  * Creates message struct namespace
//  * @param {*} messagesJson - Array of messages schemas
//  * @param {*} headerSchema - message header schema
//  */
// export function initializeMessages<KEYS extends IName = IName>(
//   messagesJson: Record<KEYS, SchemaObj>,
//   headerSchema?: SchemaObj
// ): Messages<KEYS> {
//
//   let res = {
//     __id__: [],
//     __name__: [],
//     __messages__: {},
//     HEADER_STRUCT: headerSchema ? new Struct(headerSchema) : HEADER_STRUCT
//   } as unknown as Messages<KEYS>;
//
//   for (let m of getKeysWithSortById(messagesJson)) {
//
//     let name = m.trim() as KEYS;
//     let messageObj = messagesJson[m];
//     let id = messageObj.id;
//
//     if (!res.__id__[id]) {
//       let msg_struct = new Struct(messageObj, res);
//
//       res.__id__[id] = msg_struct;
//       res.__name__[id] = name
//       res.__messages__[name] = msg_struct;
//
//     } else {
//       console.warn(`Warning: message ${id} ${name} already exists.`);
//     }
//   }
//
//   return res;
// }
//
// const getKeysWithSortById = <KEYS extends IName>(obj: Record<KEYS, SchemaObj>): KEYS[] => {
//   let keys = Object.keys(obj) as KEYS[];
//   keys.sort((a, b) => {
//     return obj[a].id - obj[b].id;
//   });
//   return keys;
// }


export class Messgen {
  private includeMessages: Messages
  private HEADER_STRUCT: StructConverter;
  
  constructor(
    private protocolJson: ProtocolJSON,
    private headerSchema?: SchemaObj
  ) {
    this.includeMessages = this.initializeMessages(protocolJson, headerSchema);
    
    this.HEADER_STRUCT = new StructConverter(
      'head',
      headerSchema ? headerSchema : HEADER_STRUCT,
      this.includeMessages.converters
    )
    
  }
  
  static initializePrimitiveConverter() {
    return basicTypes.reduce((acc, config: BasicTypesConfig) => {
      acc.set(config.name, new PrimitiveConverter(config));
      return acc;
    }, new Map<IType, Converter>())
  }
  
  private initializeMessages(
    protocolJson: ProtocolJSON,
    headerSchema?: TypeClass
  ) {
    
    const map = Messgen.initializePrimitiveConverter();
    let res = {
      typesMap: new Map<number, Converter>(),
      converters: map,
    } satisfies Messages;
    
    // TODO: add sorting types by dependency
    Object.entries(protocolJson.types).forEach(([k, v]) => {
      switch (v.type_class) {
        case "struct":
          v.fields.forEach((field) => {
            if (field.type.includes("[") || field.type.includes("{")) {
              throw new Error("Enum is not supported yet");
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
  
  serializeObj(obj: Record<string, any>) {
    // TODO: implement
  }
  
  deserializeObj(obj: ArrayBufferLike) {
    // TODO: implement
  }
  
}
