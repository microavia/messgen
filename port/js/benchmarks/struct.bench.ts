import { bench, describe } from 'vitest';
import { Codec } from "../src/Codec";
import { uploadShema, uploadBinary } from "../tests/utils";
import { MessageId } from '../src/types';

const serializedMsgs = [
    [0, uploadBinary('../../../tests/serialized_data/bin/simple_struct.bin')],
    [2, uploadBinary('../../../tests/serialized_data/bin/var_size_struct.bin')],
    [3, uploadBinary('../../../tests/serialized_data/bin/struct_with_enum.bin')],
    [4, uploadBinary('../../../tests/serialized_data/bin/empty_struct.bin')],
    [5, uploadBinary('../../../tests/serialized_data/bin/complex_struct_with_empty.bin')],
    [6, uploadBinary('../../../tests/serialized_data/bin/complex_struct_nostl.bin')],
    [7, uploadBinary('../../../tests/serialized_data/bin/flat_struct.bin')],
] as unknown as [MessageId, Buffer][];


const protoId = 1;

describe('Codec deserialization benchmark', () => {
    const protocolData = uploadShema('./messgen/test_proto/protocol.json');
    const codec = new Codec([protocolData]);

    bench('deserialize 10,000 iterations', () => {
        for (const [msgId, msgData] of serializedMsgs) {
            codec.deserialize(protoId, msgId, new Uint8Array(msgData).buffer);
        }
    }, {
        iterations: 1000
    });
});

