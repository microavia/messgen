import { Struct } from "./Struct";
import { HEADER_STRUCT } from "./HEADER_STRUCT";
import { Messages, SchemaObj, IName, ProtocolJSON } from "./types";

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
  private includeMessages: Messages<string>
  
  constructor(
    private protocolJson: ProtocolJSON,
    private headerSchema?: SchemaObj
  ) {
    this.includeMessages = this.initializeMessages(protocolJson, headerSchema);
    
  }
  
  private initializeMessages(
    protocolJson: ProtocolJSON,
    headerSchema?: SchemaObj
  ) {
    
    let res = {
      __id__: [],
      __name__: [],
      __messages__: {},
      HEADER_STRUCT: headerSchema ? new Struct(headerSchema) : HEADER_STRUCT
    } as unknown as Messages<IName>;
    
    let typesList = Object.entries<IName>(protocolJson.types_map).map(([k, v]) => ({
      id: Number(k),
      name: v.trim()
    })).sort((a, b) => a.id - b.id);
    
    for (let {
      name, id
    } of typesList) {
      
      let messageObj = protocolJson.types[name];
      
      if (messageObj.type_class !== 'struct') {
        throw new Error(`Error: message ${id} ${name} is not a struct.`);
      }
      
      
      if (res.__id__[id]) {
        throw new Error(`Warning: message ${id} ${name} already exists.`);
      }
      
      let msg_struct = new Struct(messageObj, id, res);
      
      res.__id__[id] = msg_struct;
      res.__name__[id] = name
      res.__messages__[name] = msg_struct;
      
    }
    
    for (let m of Object.entries(protocolJson.types)) {
      let name = m[0];
      let messageObj = m[1];
      
      if (messageObj.type_class !== 'struct') {
        throw new Error(`Error: message ${name} is not a struct.`);
        
      }
      if (!res.__messages__[name]) {
        res.__messages__[name] = new Struct(messageObj, undefined, res);
      }
    }
    
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
  
  getStruct(msgName: IName): Struct {
    return this.includeMessages.__messages__[msgName];
  }
  
  getNameByStruct<T extends IName = IName>(struct: Struct): T {
    return this.includeMessages.__name__[struct.id]! as T
  }
}
