import { bench, describe } from 'vitest'
// @ts-ignore
import { Buffer, Struct } from "./deserialize-variant/messgen-old.js";
import { StructConverter } from '../src/converters/base/StructConverter.js';
import { StructTypeDefinition } from '../src/types.js';
import { initGetType } from '../tests/utils.js';

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
};
// @ts-ignore
srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);


const schema: StructTypeDefinition = {
  typeClass: 'struct',
  typeName: 'testStruct',
  fields: [
    { name: 'type_Int8', type: 'int8' },
    { name: 'type_Uint8', type: 'uint8' },
    { name: 'type_Int16', type: 'int16' },
    { name: 'type_Uint16', type: 'uint16' },
    { name: 'type_Int32', type: 'int32' },
    { name: 'type_Uint32', type: 'uint32' },
    { name: 'type_Int64', type: 'int64' },
    { name: 'type_Uint64', type: 'uint64' },
    { name: 'type_String', type: 'string' },
    { name: 'type_Double', type: 'float64' },
  ]
};

const getType = initGetType();
const structConverter = new StructConverter('testStruct', schema, getType);
const size = structConverter.size(srcData);
const buffer = new Buffer(new ArrayBuffer(size));

describe('calculate size', () => {
  bench('old', () => {
    // @ts-ignore
    Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
  }, { time: 1000 })

  bench('v1', () => {
    structConverter.size(srcData);
  })
})
describe('serialize Obj', () => {
  bench('Old', () => {
    Buffer.serializeObj(srcStruct.schema.fields, srcData);
  }, { time: 1000 })
  bench('v1', () => {
    buffer.offset = 0;
    structConverter.serialize(srcData, buffer);
  })
})

describe('deserialize object', () => {
  bench('Old', () => {
    new Buffer(b).deserialize(srcStruct);
  }, { time: 1000 })
  bench('v1', () => {
    buffer.offset = 0;
    structConverter.deserialize(buffer);
  })
})

