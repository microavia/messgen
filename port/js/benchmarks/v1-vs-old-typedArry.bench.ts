import { bench, describe } from 'vitest'
// @ts-ignore
import { Buffer, Struct } from "./deserialize-variant/messgen-old.js";
import { TypeClass } from "../src/types.js";
import { StructConverter } from "../src/converters/StructConverter.js";
import { NestedConverter } from "../src/converters/NestedConverter";
import { initializeBasicConverter } from '../tests/utils.js';

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

    { name: 'type_Int8_a', type: 'Int8[]' },
    { name: 'type_Uint8_a', type: 'Uint8[]' },
    { name: 'type_Int16_a', type: 'Int16[]' },
    { name: 'type_Uint16_a', type: 'Uint16[]' },
    { name: 'type_Int32_a', type: 'Int32[]' },
    { name: 'type_Uint32_a', type: 'Uint32[]' },
    { name: 'type_Int64_a', type: 'Int64[]' },
    { name: 'type_Uint64_a', type: 'Uint64[]' },
    { name: 'type_String_a', type: 'String[]' },
    { name: 'type_Double_a', type: 'Double[]' },

    { name: 'type_Int8_as', type: 'Int8[1000]' },
    { name: 'type_Uint8_as', type: 'Uint8[1000]' },
    { name: 'type_Int16_as', type: 'Int16[1000]' },
    { name: 'type_Uint16_as', type: 'Uint16[1000]' },
    { name: 'type_Int32_as', type: 'Int32[1000]' },
    { name: 'type_Uint32_as', type: 'Uint32[1000]' },
    { name: 'type_Int64_as', type: 'Int64[1000]' },
    { name: 'type_Uint64_as', type: 'Uint64[1000]' },
    { name: 'type_String_as', type: 'String[1000]' },
    { name: 'type_Double_as', type: 'Double[1000]' },

  ]
});

const arry = new Array(1000).fill(0).map((_, i) => i);
let srcDataFn = () => ({
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

  type_Int8_a: new Int8Array(arry),
  type_Uint8_a: new Uint8Array(arry),
  type_Int16_a: new Int16Array(arry),
  type_Uint16_a: new Uint16Array(arry),
  type_Int32_a: new Int32Array(arry),
  type_Uint32_a: new Uint32Array(arry),
  type_Int64_a: new BigInt64Array(arry.map(BigInt)),
  type_Uint64_a: new BigUint64Array(arry.map(BigInt)),
  type_String_a: arry.map(i => `String ${i}`),
  type_Double_a: arry.map(i => Math.PI * i),

  type_Int8_as: new Int8Array(arry),
  type_Uint8_as: new Uint8Array(arry),
  type_Int16_as: new Int16Array(arry),
  type_Uint16_as: new Uint16Array(arry),
  type_Int32_as: new Int32Array(arry),
  type_Uint32_as: new Uint32Array(arry),
  type_Int64_as: new BigInt64Array(arry.map(BigInt)),
  type_Uint64_as: new BigUint64Array(arry.map(BigInt)),
  type_String_as: arry.map(i => `String ${i}`),
  type_Double_as: arry.map(i => Math.PI * i),
});
const srcData = srcDataFn();
// @ts-ignore
srcData.__SIZE__ = Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcData));
let b = Buffer.serializeObj(srcStruct.schema.fields, srcData);


const converters = initializeBasicConverter();
const schema: TypeClass = {
  type_class: 'struct',
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

    { name: 'type_Int8_a', type: 'int8[]' },
    { name: 'type_Uint8_a', type: 'uint8[]' },
    { name: 'type_Int16_a', type: 'int16[]' },
    { name: 'type_Uint16_a', type: 'uint16[]' },
    { name: 'type_Int32_a', type: 'int32[]' },
    { name: 'type_Uint32_a', type: 'uint32[]' },
    { name: 'type_Int64_a', type: 'int64[]' },
    { name: 'type_Uint64_a', type: 'uint64[]' },
    { name: 'type_String_a', type: 'string[]' },
    { name: 'type_Double_a', type: 'float64[]' },

    { name: 'type_Int8_as', type: 'int8[1000]' },
    { name: 'type_Uint8_as', type: 'uint8[1000]' },
    { name: 'type_Int16_as', type: 'int16[1000]' },
    { name: 'type_Uint16_as', type: 'uint16[1000]' },
    { name: 'type_Int32_as', type: 'int32[1000]' },
    { name: 'type_Uint32_as', type: 'uint32[1000]' },
    { name: 'type_Int64_as', type: 'int64[1000]' },
    { name: 'type_Uint64_as', type: 'uint64[1000]' },
    { name: 'type_String_as', type: 'string[1000]' },
    { name: 'type_Double_as', type: 'float64[1000]' },
  ]
};
const name = 'testStruct';

schema.fields?.forEach((field) => {
  if (field.type.includes("[") || field.type.includes("{")) {
    converters.set(field.type, new NestedConverter(
      field.type,
      converters
    ));
  }
})


const structConverter = new StructConverter(name, schema, converters);

const size = structConverter.size(srcData);
const buffer = new Buffer(new ArrayBuffer(size));

describe('calculate size with typedArray', () => {
  bench('old', () => {
    // @ts-ignore
    Buffer.calcSize(Buffer.createValueArray(srcStruct.fields, srcDataFn()));
  }, { time: 1000 })

  bench('v1', () => {
    structConverter.size(srcDataFn());
  })
})
describe('serialize Obj with typedArray', () => {
  bench('Old', () => {
    Buffer.serializeObj(srcStruct.schema.fields, srcDataFn());
  }, { time: 1000 })
  bench('v1', () => {
    buffer.offset = 0;
    structConverter.serialize(srcDataFn(), buffer);
  })
})

describe('deserialize object with typedArray', () => {


  bench('Old', () => {
    new Buffer(b).deserialize(srcStruct);
  }, { time: 1000 })

  bench('v1', () => {
    buffer.offset = 0;
    structConverter.deserialize(buffer);
  })
})

