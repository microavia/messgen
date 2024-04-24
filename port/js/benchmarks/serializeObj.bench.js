import { bench, describe } from 'vitest'
import {Struct} from "../src/Struct.ts";
import {Buffer} from "../src/Buffer.ts";

let srcStruct = new Struct({
  id: 2,
  fields: [
    { name: 'type_Int8', type: 'Int8' },
    { name: 'type_Uint8', type: 'Uint8' },
    { name: 'type_Int16', type: 'Int16' },
    { name: 'type_Uint16', type: 'Uint16' },
    { name: 'type_Int32', type: 'Int32' },
    { name: 'type_Uint32', type: 'Uint32' },
    { name: 'type_Int64', type: 'Int64' },
    { name: 'type_Uint64', type: 'Uint64' },
    { name: 'type_String', type: 'String' },
    { name: 'type_Double', type: 'Double' },
    { name: 'type_Char', type: 'Char' }
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
  type_String: 'This is test string',
  type_Double: -Math.PI,
  type_Char: 'A'
};
srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);

describe('Buffer Operations', () => {
  bench('calculate size', () => {
    srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
  }, { time: 1000 })

  bench('serialize object', () => {
    let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);
  }, { time: 1000 })

  bench('deserialize object', () => {
    let res = new Buffer(b).deserialize(srcStruct);
  }, { time: 1000 })
})

