import { HEADER_STRUCT } from "./HEADER_STRUCT.js";
import { parseType } from "./parseType.js";
import { DYN_TYPE_SIZE, DYN_WRITE, DYN_READ, typeIndex, readFunc, writeFunc } from "./constants.js";
import { encodeUTF8 } from "./utf8.js";
import { Struct, FieldStruct } from "./Struct";
import { Messages, SchemaObj, Obj, Field } from "./types";

/**
 * class Buffer
 */
export class Buffer {
  private _dynamicOffset: number;
  private _includeMessages?: Messages<string>
  
  set dataView(value: DataView) {
    this._dataView = value;
  }
  
  private _dataView: DataView;
  
  constructor(arrayBuffer: ArrayBufferLike) {
    this._dataView = new DataView(arrayBuffer);
    this._dynamicOffset = 0;
  }
  
  // TODO: перенести в модуль messages
  // а модуль messages генерализировать
  static deserialize(messages, data, headerStruct = HEADER_STRUCT, includeMessages?: Messages<string>) {
    let res = [];
    let buf = new Buffer(data);
    let cur = 0;
    while (cur < buf.size) {
      let h = buf.deserialize(headerStruct, cur),
        m = buf.deserialize(messages.__id__[h.msg_id], cur + h.__SIZE__);
      m.__MSG_ID__ = h.msg_id;
      cur += h.__SIZE__ + m.__SIZE__;
      res.push(m);
    }
    return res;
  }
  
  static mergeArrayBuffers(tArrs: Array<unknown>, type = Uint8Array): Uint8Array {
    const ret = new (type)(tArrs.reduce((acc, tArr) => acc + tArr.byteLength, 0));
    let off = 0;
    tArrs.forEach((tArr) => {
      ret.set(new (type)(tArr), off);
      off += tArr.byteLength;
    });
    return ret;
  }
  
  static appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBufferLike {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  }
  
  static calcSize(fields: FieldStruct[], includeMessages?: Messages<string>) {
    
    let size = 0;
    
    for (let i = 0, len = fields.length; i < len; i++) {
      
      let fi = fields[i],
        tp = fi._prop = parseType(fi.type, includeMessages);
      
      if (tp.isArray) {
        
        if (tp.isComplex) {
          if (tp.length === 0) {
            size += DYN_TYPE_SIZE;
          }
          for (let i = 0; i < fi.value.length; i++) {
            let arr = Buffer.createValueArray(fi._prop.typeIndex.fields, fi.value[i], includeMessages);
            size += Buffer.calcSize(arr, includeMessages);
          }
        } else {
          
          let arrayLength = 0;
          
          // Dynamic size array
          if (tp.length === 0) {
            arrayLength = fi.value.length;
            size += tp.typeSize * arrayLength + DYN_TYPE_SIZE; // for dynamic array length descriptor
          } else {
            // static size array
            arrayLength = tp.length;
            size += tp.typeSize * arrayLength;
          }
          
          if (tp.typeIndex === typeIndex.String) {
            fi._bytes = [];
            for (let i = 0; i < arrayLength; i++) {
              let b = encodeUTF8(fi.value[i] || "");
              fi._bytes.push(b);
              size += b.length;
            }
          }
        }
        
      } else if (tp.typeIndex === typeIndex.String) {
        fi._bytes = encodeUTF8(fi.value || "");
        size += tp.typeSize + fi._bytes.length;
      } else {
        
        if (tp.isComplex) {
          size += Buffer.calcSize(fi.value, includeMessages);
        } else {
          size += tp.typeSize;
        }
      }
    }
    
    return size;
  }
  
  static createValueArray(schemaFields: SchemaObj["fields"], obj: Obj, includeMessages?: Messages<string>) {
    const len = schemaFields.length;
    
    let arr = new Array(len);
    
    for (let k = 0; k < len; k++) {
      
      let sk = schemaFields[k],
        type = sk.type;
      
      if (includeMessages && includeMessages[type]) {
        arr[k] = {
          'value': Buffer.createValueArray(includeMessages[type].fields, obj[sk.name], includeMessages),
          'type': type
        }
      } else {
        arr[k] = { 'value': obj[sk.name], 'type': type };
      }
    }
    
    return arr;
  }
  
  static serializeMessage(struct: Struct, obj: Obj, headerStruct = HEADER_STRUCT, includeMessages?: Messages<string>) {
    
    let arr = Buffer.createValueArray(struct.fields, obj, includeMessages);
    
    let messageSize = Buffer.calcSize(arr, includeMessages);
    
    let headerBuf = Buffer.serializeObj(headerStruct.fields, {
        seq: obj.seq,
        size: messageSize,
        cls: obj.cls,
        msg_id: struct.id
      },
      includeMessages);
    
    return Buffer.appendBuffer(headerBuf, Buffer.serialize(arr, includeMessages));
  }
  
  static serializeObj(schemaFields: FieldStruct[], obj: Obj, includeMessages?: Messages<string>) {
    
    let arr = Buffer.createValueArray(schemaFields, obj, includeMessages);
    
    return Buffer.serialize(arr, includeMessages);
  }
  
  static writeDataView(fields: FieldStruct[], dataView, includeMessages?: Messages<string>, offset: number = 0) {
    
    for (let i = 0, len = fields.length; i < len; i++) {
      
      let fi = fields[i],
        p = fi._prop;
      
      if (p.isArray) {
        
        let arrayLength = p.length;
        
        // Setting array size value for dynamic array size
        if (arrayLength === 0) {
          arrayLength = fi.value.length;
          offset += DYN_WRITE(dataView, offset, fi.value.length);
        }
        
        // Write array
        for (let j = 0; j < arrayLength; j++) {
          let val = fi._bytes && fi._bytes[j] || fi.value[j];
          if (p.isComplex) {
            let valArr = Buffer.createValueArray(p.typeIndex.fields, fi.value[j], includeMessages);
            let size = Buffer.calcSize(valArr, includeMessages);
            Buffer.writeDataView(valArr, dataView, includeMessages, offset);
            offset += size;
          } else {
            offset += writeFunc[p.typeIndex](dataView, offset, val);
          }
        }
        
      } else {
        
        if (p.isComplex) {
          let size = Buffer.calcSize(fi.value, includeMessages);
          Buffer.writeDataView(fi.value, dataView, includeMessages, offset);
          offset += size;
        } else {
          let val = fi._bytes || fi.value;
          offset += writeFunc[p.typeIndex](dataView, offset, val);
        }
      }
    }
    
    return offset;
  }
  
  static serialize(fields: FieldStruct[], includeMessages?: Messages<string>) {
    
    let allSize = Buffer.calcSize(fields, includeMessages);
    
    let arrayBuffer = new ArrayBuffer(allSize),
      dv = new DataView(arrayBuffer);
    
    Buffer.writeDataView(fields, dv, includeMessages);
    
    return arrayBuffer;
  }
  
  get size(): number {
    return this._dataView.buffer.byteLength;
  }
  
  get dataView(): DataView {
    return this._dataView;
  }
  
  set(arrayBuffer: ArrayBufferLike): void {
    this._dataView = null;
    this._dataView = new DataView(arrayBuffer);
  }
  
  deserialize(struct: Struct, offset: number = 0, sizeOffset: number = 0): Obj {
    this._dynamicOffset = 0;
    let res = this.__deserialize__(struct, offset, sizeOffset);
    res.__SIZE__ = struct.size + this._dynamicOffset + sizeOffset;
    return res;
  }
  
  __deserialize__(struct: Struct, offset: number = 0, sizeOffset: number = 0): Obj {
    
    this._includeMessages = struct._includeMessages;
    
    let fields = struct.fields,
      dv = this._dataView,
      res = {};
    
    let currOffset = 0;
    
    for (let f = 0, len = fields.length; f < len; f++) {
      
      let fi = fields[f],
        p = fi._prop;
      
      currOffset = offset + fi._offset;
      
      if (p.isArray) {
        
        if (p.length === 0) {
          
          //
          // Dynamic size array
          //
          
          let length = DYN_READ(dv, currOffset + this._dynamicOffset);
          
          res[fi.name] = new Array(length);
          
          let currOffset_dyn = DYN_TYPE_SIZE + currOffset;
          
          if (p.typeIndex === typeIndex.String) {
            for (let j = 0; j < length; j++) {
              res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset_dyn + this._dynamicOffset + j * p.typeSize);
              this._dynamicOffset += dv.getUint32(currOffset_dyn + this._dynamicOffset + j * p.typeSize, true);
            }
          } else {
            if (p.isComplex) {
              for (let j = 0; j < length; j++) {
                res[fi.name][j] = this.__deserialize__(p.typeIndex, currOffset_dyn + j * p.typeSize, sizeOffset);
              }
            } else {
              for (let j = 0; j < length; j++) {
                res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset_dyn + this._dynamicOffset + j * p.typeSize);
              }
            }
          }
          
          this._dynamicOffset += length * p.typeSize;
          
        } else {
          
          //
          //Static size array
          //
          
          res[fi.name] = new Array(p.length);
          
          if (p.typeIndex === typeIndex.String) {
            for (let j = 0; j < p.length; j++) {
              res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset + this._dynamicOffset + j * p.typeSize);
              this._dynamicOffset += dv.getUint32(currOffset + this._dynamicOffset + j * p.typeSize, true);
            }
          } else {
            if (p.isComplex) {
              for (let j = 0; j < p.length; j++) {
                res[fi.name][j] = this.__deserialize__(p.typeIndex, currOffset + j * p.typeSize, sizeOffset);
              }
            } else {
              for (let j = 0; j < p.length; j++) {
                res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset + this._dynamicOffset + j * p.typeSize);
              }
            }
          }
        }
        
      } else {
        
        if (p.isComplex) {
          
          res[fi.name] = this.__deserialize__(p.typeIndex, currOffset, sizeOffset);
          
        } else {
          
          res[fi.name] = readFunc[p.typeIndex](dv, currOffset + this._dynamicOffset);
          
          if (p.typeIndex === typeIndex.String) {
            this._dynamicOffset += dv.getUint32(currOffset + this._dynamicOffset, true);
          }
        }
      }
    }
    
    return res;
  }
}
