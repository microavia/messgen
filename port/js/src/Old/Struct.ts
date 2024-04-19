import { parseType, ParseType } from "../utils/parseType";
import { DYN_TYPE_SIZE } from "../constants";
import { TypeClass, Messages, Field, IId } from "../types";


export type FieldStruct = Field & {
  _offset: number
  _prop: ParseType
};

/**
 *
 * class Struct
 */
export class Struct {
  _id: IId = 0;
  _size: number;
  _fields: Array<FieldStruct>
  _schema: TypeClass
  _includeMessages?: Messages<string>
  
  constructor(
    schema: TypeClass,
    id?: IId,
    includeMessages?: Messages<string>
  ) {
    
    if (!schema) {
      throw new Error('Schema is not defined');
    }
    
    this._includeMessages = includeMessages;
    if (id) {
      this._id = id;
    }
    this._size = 0;
    this._fields = new Array(schema.fields.length);
    this._schema = schema;
    this._init();
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
  
  
  _init() {
    
    let schemaFields = this._schema.fields;
    
    let offset = 0;
    
    for (let i = 0, len = schemaFields.length; i < len; i++) {
      
      let si = schemaFields[i]
      let tp = parseType(si.type, this._includeMessages);
      
      this._fields[i] = {
        name: si.name,
        type: si.type,
        _offset: offset,
        _prop: tp
      };
      
      if (tp.wrapper.length) {
      
      tp.wrapper.reverse().forEach((w) => {
        switch (w.variant) {
          case "array":
            break;
          case "map":
            break;
        }
        
        if (tp.length === 0) {
          offset += DYN_TYPE_SIZE;
        } else {
          offset += tp.typeSize * tp.length;
        }
      })
      
      
      } else {
        offset += tp.typeSize;
      }
    }
    
    this._size = offset;
  }
}

