import { StructConverter } from '../../src/converters/base/StructConverter';
import type { StructTypeDefinition } from '../../src/types';
import { initGetType } from '../../tests/utils';
import { Buffer } from '../../src/Buffer';

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
  ],
};

const array = new Array(1000).fill(0).map((_, i) => i);
const srcDataFn = () => ({
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

  type_Int8_a: new Int8Array(array),
  type_Uint8_a: new Uint8Array(array),
  type_Int16_a: new Int16Array(array),
  type_Uint16_a: new Uint16Array(array),
  type_Int32_a: new Int32Array(array),
  type_Uint32_a: new Uint32Array(array),
  type_Int64_a: new BigInt64Array(array.map(BigInt)),
  type_Uint64_a: new BigUint64Array(array.map(BigInt)),
  type_String_a: array.map((i) => `String ${i}`),
  type_Double_a: array.map((i) => Math.PI * i),

  type_Int8_as: new Int8Array(array),
  type_Uint8_as: new Uint8Array(array),
  type_Int16_as: new Int16Array(array),
  type_Uint16_as: new Uint16Array(array),
  type_Int32_as: new Int32Array(array),
  type_Uint32_as: new Uint32Array(array),
  type_Int64_as: new BigInt64Array(array.map(BigInt)),
  type_Uint64_as: new BigUint64Array(array.map(BigInt)),
  type_String_as: array.map((i) => `String ${i}`),
  type_Double_as: array.map((i) => Math.PI * i),
});
const srcData = srcDataFn();

const structConverter = new StructConverter(schema, initGetType());
const size = structConverter.size(srcData);
const buffer = new Buffer(new ArrayBuffer(size));

// run with 'node --inspect=9229 --require ts-node/register ./src/index.ts"
// to debug performance issues with structure serialization/deserialization
const run = async (): Promise<void> => {
  structConverter.serialize(srcData, buffer);
  let counter = 0;
  while (true) {
    counter += 1;

    buffer.offset = 0;
    structConverter.deserialize(buffer);
    console.log('Counter:', counter);
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
