'use strict';

import { encodeUTF8, decodeUTF8 } from "./utf8.js";

const IS_LITTLE_ENDIAN = true;

/**
 *
 * Read function returns value from byte array.
 * Write function returns type byte size.
 */
const basicTypes = [
    {
        name: "Char",
        size: 1,
        read: (v, s) => String.fromCharCode(v.getInt8(s, IS_LITTLE_ENDIAN)),
        write: (v, s, a) => { v.setInt8(s, a ? a.toString().charCodeAt(0) : 0, IS_LITTLE_ENDIAN); return 1; }
    }, {
        name: "Int8",
        size: 1,
        read: (v, s) => v.getInt8(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setInt8(s, a, IS_LITTLE_ENDIAN); return 1; }
    }, {
        name: "Uint8",
        size: 1,
        read: (v, s) => v.getUint8(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setUint8(s, a, IS_LITTLE_ENDIAN); return 1; }
    }, {
        name: "Int16",
        size: 2,
        read: (v, s) => v.getInt16(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setInt16(s, a, IS_LITTLE_ENDIAN); return 2; }
    }, {
        name: "Uint16",
        size: 2,
        read: (v, s) => v.getUint16(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setUint16(s, a, IS_LITTLE_ENDIAN); return 2; }
    }, {
        name: "Int32",
        size: 4,
        read: (v, s) => v.getInt32(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setInt32(s, a, IS_LITTLE_ENDIAN); return 4; }
    }, {
        name: "Uint32",
        size: 4,
        read: (v, s) => v.getUint32(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setUint32(s, a, IS_LITTLE_ENDIAN); return 4; }
    }, {
        name: "Int64",
        size: 8,
        read: (v, s) => v.getBigInt64(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setBigInt64(s, a, IS_LITTLE_ENDIAN); return 8; }
    }, {
        name: "Uint64",
        size: 8,
        read: (v, s) => v.getBigUint64(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setBigUint64(s, a, IS_LITTLE_ENDIAN); return 8; }
    }, {
        name: "Float",
        size: 4,
        read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setFloat32(s, a, IS_LITTLE_ENDIAN); return 4; }
    }, {
        name: "Float32",
        size: 4,
        read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setFloat32(s, a, IS_LITTLE_ENDIAN); return 4; }
    }, {
        name: "Double",
        size: 8,
        read: (v, s) => v.getFloat64(s, IS_LITTLE_ENDIAN),
        write: (v, s, a) => { v.setFloat64(s, a, IS_LITTLE_ENDIAN); return 8; }
    }, {
        name: "String",
        size: 2,
        read: (v, s) => decodeUTF8(new Uint8Array(v.buffer, s + 2, v.getUint16(s, IS_LITTLE_ENDIAN))),
        write: (v, s, a) => {
            let size = a.length;
            v.setUint16(s, size, true);
            for (let i = 0, s2 = s + 2; i < size; i++) {
                v.setUint8(s2 + i, a[i], true);
            }
            return size + 2;
        }
    }
];

let typeIndex = [],
    typeSize = [];

let readFunc = [],
    writeFunc = [];

for (let i = 0; i < basicTypes.length; i++) {
    let ti = basicTypes[i];
    typeIndex[ti.name] = i;
    typeSize[i] = ti.size;
    readFunc[i] = ti.read;
    writeFunc[i] = ti.write;
}

function parseType(typeStr, includeMessages) {

    let a = typeStr.split('['),
        name = a[0].trim();

    let size, isComplex = false;

    let type = typeIndex[name];

    if (type != undefined) {
        size = typeSize[type];
    } else if (includeMessages && includeMessages[name]) {
        type = includeMessages[name];
        size = type.size;
        isComplex = true;
    } else {
        // UNKNOWN TYPE
    }

    let length = parseInt(a[1]);

    return {
        typeIndex: type,
        typeSize: size,
        length: isNaN(length) ? 0 : length,
        isArray: a.length === 2,
        isComplex: isComplex
    };
};
/**
 * class Struct
 */
export class Struct {
    constructor(schema, includeMessages) {

        this._id = 0;
        this._size = 0;
        this._fields = null;
        this._schema = null;

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
                    offset += typeSize[typeIndex.Uint16];
                } else {
                    offset += tp.typeSize * tp.length;
                }
            } else {
                offset += tp.typeSize;
            }
        }

        this._size = offset;
    }
};

// uint32 seq;             //!< Sequence number
// uint16 size;              //!< Message payload size
// uint8 cls;           //!< Message class
// uint8 msg_id;           //!< Message type ID

export const HEADER_STRUCT = new Struct({
    fields: [
        { 'name': "seq", 'type': "Uint32" },
        { 'name': "cls", 'type': "Uint8" },
        { 'name': "msg_id", 'type': "Uint8" },
        { 'name': "size", 'type': "Uint16" }
    ]
});

/**
 * class Buffer
 */
export class Buffer {
    constructor(arrayBuffer) {
        this._dataView = new DataView(arrayBuffer);
        this._dynamicOffset = 0;
    }

    // TODO: перенести в модуль messages
    // а модуль messages генерализировать
    static deserialize(messages, data, headerStruct = HEADER_STRUCT, includeMessages) {
        let res = [];
        let buf = new Buffer(data, includeMessages);
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

    static mergeArrayBuffers(tArrs, type = Uint8Array) {
        const ret = new (type)(tArrs.reduce((acc, tArr) => acc + tArr.byteLength, 0));
        let off = 0;
        tArrs.forEach((tArr) => {
            ret.set(new (type)(tArr), off);
            off += tArr.byteLength;
        });
        return ret;
    }

    static appendBuffer(buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    }

    static calcSize(fields, includeMessages) {

        let size = 0;

        for (let i = 0, len = fields.length; i < len; i++) {

            let fi = fields[i],
                tp = fi._prop = parseType(fi.type, includeMessages);

            if (tp.isArray) {

                if (tp.isComplex) {
                    if (tp.length === 0) {
                        size += 2;
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
                        size += tp.typeSize * arrayLength + 2; // two bytes for dynamic array length descriptor
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

    static createValueArray(schemaFields, obj, includeMessages) {

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

    static serializeMessage(struct, obj, headerStruct = HEADER_STRUCT, includeMessages) {

        let arr = Buffer.createValueArray(struct.fields, obj);

        let messageSize = Buffer.calcSize(arr);

        let headerBuf = Buffer.serializeObj(headerStruct.fields, {
            seq: obj.seq,
            size: messageSize,
            cls: obj.cls,
            msg_id: struct.id
        },
            includeMessages);

        return Buffer.appendBuffer(headerBuf, Buffer.serialize(arr, includeMessages));
    }

    static serializeObj(schemaFields, obj, includeMessages) {

        let arr = Buffer.createValueArray(schemaFields, obj, includeMessages);

        return Buffer.serialize(arr, includeMessages);
    }

    static writeDataView(fields, dataView, includeMessages, offset = 0) {

        for (let i = 0, len = fields.length; i < len; i++) {

            let fi = fields[i],
                p = fi._prop;

            if (p.isArray) {

                let arrayLength = p.length;

                // Setting array size value for dynamic array size
                if (arrayLength === 0) {
                    arrayLength = fi.value.length;
                    offset += writeFunc[typeIndex.Uint16](dataView, offset, fi.value.length);
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

    static serialize(fields, includeMessages) {

        let allSize = Buffer.calcSize(fields, includeMessages);

        let arrayBuffer = new ArrayBuffer(allSize),
            dv = new DataView(arrayBuffer);

        Buffer.writeDataView(fields, dv, includeMessages);

        return arrayBuffer;
    }

    get size() {
        return this._dataView.buffer.byteLength;
    }

    get dataView() {
        return this._dataView;
    }

    set(arrayBuffer) {
        this._dataView = null;
        this._dataView = new DataView(arrayBuffer);
    }

    deserialize(struct, offset = 0, sizeOffset = 0) {
        this._dynamicOffset = 0;
        let res = this.__deserialize__(struct, offset, sizeOffset);
        res.__SIZE__ = struct.size + this._dynamicOffset + sizeOffset;
        return res;
    }

    __deserialize__(struct, offset, sizeOffset, stopSize) {

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

                    let length = dv.getUint16(currOffset + this._dynamicOffset, true);

                    res[fi.name] = new Array(length);

                    let currOffset_2 = 2 + currOffset;

                    if (p.typeIndex === typeIndex.String) {
                        for (let j = 0; j < length; j++) {
                            res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset_2 + this._dynamicOffset + j * p.typeSize);
                            this._dynamicOffset += dv.getUint16(currOffset_2 + this._dynamicOffset + j * p.typeSize, true);
                        }
                    } else {
                        if (p.isComplex) {
                            for (let j = 0; j < length; j++) {
                                res[fi.name][j] = this.__deserialize__(p.typeIndex, currOffset_2 + j * p.typeSize, sizeOffset);
                            }
                        } else {
                            for (let j = 0; j < length; j++) {
                                res[fi.name][j] = readFunc[p.typeIndex](dv, currOffset_2 + this._dynamicOffset + j * p.typeSize);
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
                            this._dynamicOffset += dv.getUint16(currOffset + this._dynamicOffset + j * p.typeSize, true);
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
                        this._dynamicOffset += dv.getUint16(currOffset + this._dynamicOffset, true);
                    }
                }
            }
        }

        return res;
    }
};

/**
 * Creates message struct namespace
 * @param {*} messagesJson - Array of messages schemas
 * @param {*} headerSchema - message header schema
 */
export function initializeMessages(messagesJson, headerSchema) {

    let res = {
        __id__: [],
        __name__: [],
        HEADER_STRUCT: headerSchema ? new Struct(headerSchema) : HEADER_STRUCT
    };

    for (let m in messagesJson) {

        let name = m.trim(),
            msg = "MSG_" + name.toUpperCase(),
            id = messagesJson[m].id;


        if (!res.__id__[id]) {
            let msg_struct = new Struct(messagesJson[m], res);

            res.__id__[id] = msg_struct;
            res.__name__[id] = m.trim();
            res[msg] = msg_struct;
            res[name] = msg_struct;

        } else {
            console.warn(`Warning: message ${id} ${msg} already exists.`);
        }
    }

    return res;
};