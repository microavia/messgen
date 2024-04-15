import { parseType, ParseType } from "./parseType.js";
import { DYN_TYPE_SIZE } from "./constants.js";
import { SchemaObj, Messages, Field } from "./types";


export type FieldStruct = Field & {
  _offset: number
  _prop: ParseType
};

/**
 *
 * class Struct
 */
export class Struct {
  _id = 0;
  _size = 0;
  _fields: Array<FieldStruct> = null;
  _schema = null;
  _includeMessages?: Messages<string>
  
  constructor(schema: SchemaObj, includeMessages?: Messages<string>) {
    this._includeMessages = includeMessages;
    this.set(schema);
  }
  
  get schema() {
    return this._schema;
  }
  
  get id() {
    return this._id;
  }
  
  get size() {
    return this._size;
  }
  
  get fields() {
    return this._fields;
  }
  
  set(schema) {
    if (schema) {
      this._id = schema.id || 0;
      this._size = 0;
      this._fields = new Array(schema.fields.length);
      this._schema = schema;
      this._init();
    }
  }
  
  _init() {
    
    let schemaFields = this._schema.fields;
    
    let offset = 0;
    
    for (let i = 0, len = schemaFields.length; i < len; i++) {
      
      let si = schemaFields[i],
        tp = parseType(si.type, this._includeMessages);
      
      this._fields[i] = {
        name: si.name,
        type: si.type,
        _offset: offset,
        _prop: tp
      };
      
      if (tp.isArray) {
        if (tp.length === 0) {
          offset += DYN_TYPE_SIZE;
        } else {
          offset += tp.typeSize * tp.length;
        }
      } else {
        offset += tp.typeSize;
      }
    }
    
    this._size = offset;
  }
}

