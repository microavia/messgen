import {bench, describe} from 'vitest'

import {Buffer} from './deserialize-variant/messgen-old.js';
import {Buffer as BufferFromEntries} from './deserialize-variant/messgen-fromEntries.js';
import {Buffer as BufferPreBuild, Struct as StructPreBuild} from './deserialize-variant/messgen-pre-build.js';
import {Struct} from "../src/Old/Struct.ts";

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
    { name: 'type_Char', type: 'Char' },
    { name: '_type_Int8', type: 'Int8' },
    { name: '_type_Uint8', type: 'Uint8' },
    { name: '_type_Int16', type: 'Int16' },
    { name: '_type_Uint16', type: 'Uint16' },
    { name: '_type_Int32', type: 'Int32' },
    { name: '_type_Uint32', type: 'Uint32' },
    { name: '_type_Int64', type: 'Int64' },
    { name: '_type_Uint64', type: 'Uint64' },
    { name: '_type_String', type: 'String' },
    { name: '_type_Double', type: 'Double' },
    { name: '_type_Char', type: 'Char' }
  ]
});

let srcStructPrebild = new StructPreBuild({
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
    { name: 'type_Char', type: 'Char' },
    { name: '_type_Int8', type: 'Int8' },
    { name: '_type_Uint8', type: 'Uint8' },
    { name: '_type_Int16', type: 'Int16' },
    { name: '_type_Uint16', type: 'Uint16' },
    { name: '_type_Int32', type: 'Int32' },
    { name: '_type_Uint32', type: 'Uint32' },
    { name: '_type_Int64', type: 'Int64' },
    { name: '_type_Uint64', type: 'Uint64' },
    { name: '_type_String', type: 'String' },
    { name: '_type_Double', type: 'Double' },
    { name: '_type_Char', type: 'Char' }
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
  type_Char: 'A',
  _type_Int8: 8,
  _type_Uint8: 8,
  _type_Int16: 8,
  _type_Uint16: 8,
  _type_Int32: 8,
  _type_Uint32: 8,
 _type_Int64: BigInt(8),
 _type_Uint64: BigInt(8),
  _type_String: 'This is test string',
  _type_Double: -Math.PI,
  _type_Char: 'A'
};
srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);



describe('Buffer(b).deserialize ', () => {

  beforeEach(() => {
    srcData = {
      ...srcData,
      type_Int32: srcData.type_Int32 + 1,
    };
    srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
    b = Buffer.serializeObj(srcStruct.schema.fields, srcData);
  })
  bench('Object.fromEntries', () => {
    let res = new BufferFromEntries(b).deserialize(srcStruct);
  })
  bench('pre build object Object', () => {
    let res = new BufferPreBuild(b).deserialize(srcStructPrebild);
  })
  bench('mutation Object', () => {
    let res = new Buffer(b).deserialize(srcStruct);
  })

})
