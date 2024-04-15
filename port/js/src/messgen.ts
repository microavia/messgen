import { Struct } from "./Struct";
import { HEADER_STRUCT } from "./HEADER_STRUCT";
import { Messages, SchemaObj, IName } from "./types";


/**
 * Creates message struct namespace
 * @param {*} messagesJson - Array of messages schemas
 * @param {*} headerSchema - message header schema
 */
export function initializeMessages<KEYS extends IName = IName>(
  messagesJson: Record<KEYS, SchemaObj>,
  headerSchema?: SchemaObj
): Messages<KEYS> {
  
  let res = {
    __id__: [],
    __name__: [],
    HEADER_STRUCT: headerSchema ? new Struct(headerSchema) : HEADER_STRUCT
  } as unknown as Messages<KEYS>;
  
  for (let m of getKeysWithSortById(messagesJson)) {
    
    let name = m.trim() as KEYS;
    let messageObj = messagesJson[m];
    let id = messageObj.id;
    
    if (!res.__id__[id]) {
      let msg_struct = new Struct(messageObj, res);
      
      res.__id__[id] = msg_struct;
      res.__name__[id] = name
      res[name] = msg_struct;
      
    } else {
      console.warn(`Warning: message ${id} ${name} already exists.`);
    }
  }
  
  return res;
}

const getKeysWithSortById = <KEYS extends IName>(obj: Record<KEYS, SchemaObj>): KEYS[] => {
  let keys = Object.keys(obj) as KEYS[];
  keys.sort((a, b) => {
    return obj[a].id - obj[b].id;
  });
  return keys;
}
