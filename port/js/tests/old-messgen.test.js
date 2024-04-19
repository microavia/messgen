import {initializeMessages} from '../src/messgen.ts';
import {Struct} from "../src/Old/Struct.ts";
import {HEADER_STRUCT} from "../src/HEADER_STRUCT.ts";
import {Buffer} from "../src/Old/Buffer.ts";

describe('Serialization deserialization tests', () => {

    it('Basic types', () => {

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: "Int8" },
                { name: "type_Uint8", type: "Uint8" },
                { name: "type_Int16", type: "Int16" },
                { name: "type_Uint16", type: "Uint16" },
                { name: "type_Int32", type: "Int32" },
                { name: "type_Uint32", type: "Uint32" },
                { name: "type_Int64", type: "Int64" },
                { name: "type_Uint64", type: "Uint64" },
                { name: "type_String", type: "String" },
                { name: "type_Double", type: "Double" },
                { name: "type_Char", type: "Char" }
            ]
        });

        let srcData = {
            type_Int8: 8,
            type_Uint8: 8,
            type_Int16: 8,
            type_Uint16: 8,
            type_Int32: 8,
            type_Uint32: 8,
            type_Int64: BigInt(8),
            type_Uint64: BigInt(8),
            type_String: "This is test string",
            type_Double: -Math.PI,
            type_Char: 'A'
        };

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);

        let res = new Buffer(b).deserialize(srcStruct);

        expect(res).toEqual(srcData);
    });

    it('Basic types fixed array size', () => {

        const ARRAY_SIZE = 100;

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: `Int8[${ARRAY_SIZE}]` },
                { name: "type_Uint8", type: `Uint8[${ARRAY_SIZE}]` },
                { name: "type_Int16", type: `Int16[${ARRAY_SIZE}]` },
                { name: "type_Uint16", type: `Uint16[${ARRAY_SIZE}]` },
                { name: "type_Int32", type: `Int32[${ARRAY_SIZE}]` },
                { name: "type_Uint32", type: `Uint32[${ARRAY_SIZE}]` },
                { name: "type_Int64", type: `Int64[${ARRAY_SIZE}]` },
                { name: "type_Uint64", type: `Uint64[${ARRAY_SIZE}]` },
                { name: "type_String", type: `String[${ARRAY_SIZE}]` },
                { name: "type_Double", type: `Double[${ARRAY_SIZE}]` },
                { name: "type_Char", type: `Char[${ARRAY_SIZE}]` }
            ]
        });

        let srcData = {
            type_Int8: new Array(ARRAY_SIZE),
            type_Uint8: new Array(ARRAY_SIZE),
            type_Int16: new Array(ARRAY_SIZE),
            type_Uint16: new Array(ARRAY_SIZE),
            type_Int32: new Array(ARRAY_SIZE),
            type_Uint32: new Array(ARRAY_SIZE),
            type_Int64: new Array(ARRAY_SIZE),
            type_Uint64: new Array(ARRAY_SIZE),
            type_String: new Array(ARRAY_SIZE),
            type_Double: new Array(ARRAY_SIZE),
            type_Char: new Array(ARRAY_SIZE)
        };

        for (let i = 0; i < ARRAY_SIZE; i++) {
            srcData.type_Int8[i] = i;
            srcData.type_Uint8[i] = i;
            srcData.type_Int16[i] = i;
            srcData.type_Uint16[i] = i;
            srcData.type_Int32[i] = i;
            srcData.type_Uint32[i] = i;
            srcData.type_Int64[i] = BigInt(-ARRAY_SIZE + i);
            srcData.type_Uint64[i] = BigInt(i);
            srcData.type_String[i] = "string-" + i;
            srcData.type_Double[i] = (-ARRAY_SIZE + i) / 3.0;
            srcData.type_Char[i] = 'a';
        }

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);

        let res = new Buffer(b).deserialize(srcStruct);

        expect(res).toEqual(srcData);
    });

    it('Basic types dynamic array size', () => {

        const ARRAY_SIZE = 100;

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: `Int8[]` },
                { name: "type_Uint8", type: `Uint8[]` },
                { name: "type_Int16", type: `Int16[]` },
                { name: "type_Uint16", type: `Uint16[]` },
                { name: "type_Int32", type: `Int32[]` },
                { name: "type_Uint32", type: `Uint32[]` },
                { name: "type_Int64", type: `Int64[]` },
                { name: "type_Uint64", type: `Uint64[]` },
                { name: "type_String", type: `String[]` },
                { name: "type_Double", type: `Double[]` },
                { name: "type_Char", type: `Char[]` }
            ]
        });

        let srcData = {
            type_Int8: new Array(ARRAY_SIZE),
            type_Uint8: new Array(ARRAY_SIZE),
            type_Int16: new Array(ARRAY_SIZE),
            type_Uint16: new Array(ARRAY_SIZE),
            type_Int32: new Array(ARRAY_SIZE),
            type_Uint32: new Array(ARRAY_SIZE),
            type_Int64: new Array(ARRAY_SIZE),
            type_Uint64: new Array(ARRAY_SIZE),
            type_String: new Array(ARRAY_SIZE),
            type_Double: new Array(ARRAY_SIZE),
            type_Char: new Array(ARRAY_SIZE)
        };

        for (let i = 0; i < ARRAY_SIZE; i++) {
            srcData.type_Int8[i] = i;
            srcData.type_Uint8[i] = i;
            srcData.type_Int16[i] = i;
            srcData.type_Uint16[i] = i;
            srcData.type_Int32[i] = i;
            srcData.type_Uint32[i] = i;
            srcData.type_Int64[i] = BigInt(-ARRAY_SIZE + i);
            srcData.type_Uint64[i] = BigInt(i);
            srcData.type_String[i] = "string-" + i;
            srcData.type_Double[i] = (-ARRAY_SIZE + i) / 3.0;
            srcData.type_Char[i] = 'A';
        }

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);

        let res = new Buffer(b).deserialize(srcStruct);

        expect(res).toEqual(srcData);
    });

    it('Basic message with header', () => {

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: "Int8" },
                { name: "type_Uint8", type: "Uint8" },
                { name: "type_Int16", type: "Int16" },
                { name: "type_Uint16", type: "Uint16" },
                { name: "type_Int32", type: "Int32" },
                { name: "type_Uint32", type: "Uint32" },
                { name: "type_Int64", type: "Int64" },
                { name: "type_Uint64", type: "Uint64" },
                { name: "type_String", type: "String" },
                { name: "type_Double", type: "Double" },
                { name: "type_Char", type: "Char" }
            ]
        });

        let srcData = {
            type_Int8: 8,
            type_Uint8: 8,
            type_Int16: -16,
            type_Uint16: 16,
            type_Int32: -32,
            type_Uint32: 32,
            type_Int64: BigInt(-64),
            type_Uint64: BigInt(64),
            type_String: "This is test string",
            type_Double: Math.PI,
            type_Char: 'A'
        };

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeMessage(srcStruct, srcData);

        let buf = new Buffer(b);
        let headerRes = buf.deserialize(HEADER_STRUCT, 0);
        let res = buf.deserialize(srcStruct, headerRes.__SIZE__);

        expect(res).toEqual(srcData);
    });

    it('Basic types fixed array size with header', () => {

        const ARRAY_SIZE = 100;

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: `Int8[${ARRAY_SIZE}]` },
                { name: "type_Uint8", type: `Uint8[${ARRAY_SIZE}]` },
                { name: "type_Int16", type: `Int16[${ARRAY_SIZE}]` },
                { name: "type_Uint16", type: `Uint16[${ARRAY_SIZE}]` },
                { name: "type_Int32", type: `Int32[${ARRAY_SIZE}]` },
                { name: "type_Uint32", type: `Uint32[${ARRAY_SIZE}]` },
                { name: "type_Int64", type: `Int64[${ARRAY_SIZE}]` },
                { name: "type_Uint64", type: `Uint64[${ARRAY_SIZE}]` },
                { name: "type_String", type: `String[${ARRAY_SIZE}]` },
                { name: "type_Double", type: `Double[${ARRAY_SIZE}]` },
                { name: "type_Char", type: `Char[${ARRAY_SIZE}]` }
            ]
        });

        let srcData = {
            type_Int8: new Array(ARRAY_SIZE),
            type_Uint8: new Array(ARRAY_SIZE),
            type_Int16: new Array(ARRAY_SIZE),
            type_Uint16: new Array(ARRAY_SIZE),
            type_Int32: new Array(ARRAY_SIZE),
            type_Uint32: new Array(ARRAY_SIZE),
            type_Int64: new Array(ARRAY_SIZE),
            type_Uint64: new Array(ARRAY_SIZE),
            type_String: new Array(ARRAY_SIZE),
            type_Double: new Array(ARRAY_SIZE),
            type_Char: new Array(ARRAY_SIZE)
        };

        for (let i = 0; i < ARRAY_SIZE; i++) {
            srcData.type_Int8[i] = i;
            srcData.type_Uint8[i] = i;
            srcData.type_Int16[i] = i;
            srcData.type_Uint16[i] = i;
            srcData.type_Int32[i] = i;
            srcData.type_Uint32[i] = i;
            srcData.type_Int64[i] = BigInt(i);
            srcData.type_Uint64[i] = BigInt(i);
            srcData.type_String[i] = "string-" + i;
            srcData.type_Double[i] = i * 12.45;
            srcData.type_Char[i] = 'A';
        }

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeMessage(srcStruct, srcData);

        let buf = new Buffer(b);
        let headerRes = buf.deserialize(HEADER_STRUCT, 0);
        let res = buf.deserialize(srcStruct, headerRes.__SIZE__);

        expect(res).toEqual(srcData);
    });

    it('Basic types dynamic array size with header', () => {

        const ARRAY_SIZE = 100;

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "type_Int8", type: `Int8[]` },
                { name: "type_Uint8", type: `Uint8[]` },
                { name: "type_Int16", type: `Int16[]` },
                { name: "type_Uint16", type: `Uint16[]` },
                { name: "type_Int32", type: `Int32[]` },
                { name: "type_Uint32", type: `Uint32[]` },
                { name: "type_Int64", type: `Int64[]` },
                { name: "type_Uint64", type: `Uint64[]` },
                { name: "type_String", type: `String[]` },
                { name: "type_Double", type: `Double[]` },
                { name: "type_Char", type: `Char[]` }
            ]
        });

        let srcData = {
            type_Int8: new Array(ARRAY_SIZE),
            type_Uint8: new Array(ARRAY_SIZE),
            type_Int16: new Array(ARRAY_SIZE),
            type_Uint16: new Array(ARRAY_SIZE),
            type_Int32: new Array(ARRAY_SIZE),
            type_Uint32: new Array(ARRAY_SIZE),
            type_Int64: new Array(ARRAY_SIZE),
            type_Uint64: new Array(ARRAY_SIZE),
            type_String: new Array(ARRAY_SIZE),
            type_Double: new Array(ARRAY_SIZE),
            type_Char: new Array(ARRAY_SIZE)
        };

        for (let i = 0; i < ARRAY_SIZE; i++) {
            srcData.type_Int8[i] = i;
            srcData.type_Uint8[i] = i;
            srcData.type_Int16[i] = i;
            srcData.type_Uint16[i] = i;
            srcData.type_Int32[i] = i;
            srcData.type_Uint32[i] = i;
            srcData.type_Int64[i] = BigInt(i);
            srcData.type_Uint64[i] = BigInt(i);
            srcData.type_String[i] = "string-" + i;
            srcData.type_Double[i] = i * 12.45;
            srcData.type_Char[i] = 'A';
        }

        //Testing proper size of the message
        srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));

        let b = Buffer.serializeMessage(srcStruct, srcData);

        let buf = new Buffer(b);
        let headerRes = buf.deserialize(HEADER_STRUCT, 0);
        let res = buf.deserialize(srcStruct, headerRes.__SIZE__);

        expect(res).toEqual(srcData);
    });

    it('Complex type with dynamic array size', () => {


        let schema = {
            "MyYZ": {
                id: 100,
                fields: [
                    { "name": "y", "type": "Int8" },
                    { "name": "z", "type": "Int16" },
                    { "name": "s", "type": "String[]" },
                ]
            },
            "Coords": {
                "id": 111,
                "fields": [
                    { "name": "x", "type": "Int16" },
                    { "name": "yz", "type": "MyYZ" },
                ]
            },
            "Param": {
                "id": 112,
                "fields": [
                    { "name": "coords", "type": "Coords[]" },
                    { "name": "xxx", "type": "Uint8" }
                ]
            }
        };

        let includeMsg = initializeMessages(schema);

        let srcStruct = new Struct({
            "id": 2,
            "fields": [
                { name: "a", type: "Int8" },
                { name: "param", type: "Param" }
            ]
        }, includeMsg);

        let srcData = {
            a: 32,
            param: {
                coords: [{
                    x: 5,
                    yz: {
                        y: 1,
                        z: 200,
                        s: ["aaaaa", "xxxx"]
                    }
                }, {
                    x: 10,
                    yz: {
                        y: 4,
                        z: 800,
                        s: ["dddddd"]
                    }
                }, {
                    x: 999,
                    yz: {
                        y: 5,
                        z: 1400,
                        s: ["e"]
                    }
                }],
                xxx: 16
            }
        };

        let valArr = Buffer.createValueArray(srcStruct.fields, srcData, includeMsg);
        srcData.__SIZE__ = Buffer.calcSize(valArr, includeMsg);

        let b = Buffer.serializeObj(srcStruct.schema.fields, srcData, includeMsg);

        let res = new Buffer(b, includeMsg).deserialize(srcStruct);

        expect(res).toEqual(srcData);
    });

    it('Error if wrong order of complex type', () => {

        // wrong order
        let schema = {
            "First": {
                id: 1,
                fields: [
                    { "name": "x", "type": "Second" },
                ]
            },
            "Second": {
                "id": 2,
                "fields": [
                    { "name": "xxx", "type": "Uint8" }
                ]
            }
        };

        expect(() => {
            initializeMessages(schema)
        }).toThrow('Unknown type');

        // missed type
        let schema1 = {
            "First": {
                id: 1,
                fields: [
                    { "name": "x", "type": "Second" },
                ]
            }
        };

        expect(() => {
            initializeMessages(schema1)
        }).toThrow('Unknown type');

        // correct location
        let schema2 = {
            "First": {
                id: 1,
                fields: [
                    { "name": "x", "type": "Uint8" },
                ]
            },
            "Second": {
                "id": 2,
                "fields": [
                    { "name": "xxx", "type": "First" }
                ]
            }
        };

        expect(() => {
            initializeMessages(schema2)
        }).not.toThrow('Unknown type');

        // change order
        let schema3 = {
            "Second": {
                "id": 2,
                "fields": [
                    { "name": "xxx", "type": "First" }
                ]
            },
            "First": {
                id: 1,
                fields: [
                    { "name": "x", "type": "Uint8" },
                ]
            },
        };

        expect(() => {
            initializeMessages(schema3)
        }).not.toThrow('Unknown type');

    })

    it('TODO: compose tests for not equal size arrays messages', () => {
        expect(true).toBe(true);
    });
});
