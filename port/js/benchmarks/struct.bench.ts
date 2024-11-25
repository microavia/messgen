import { performance } from 'perf_hooks';
import { Codec } from "../src/Codec";
import { uploadShema, uploadBinary } from "../tests/utils";
import { MessageId } from '../src/types';
import { bench, describe } from 'vitest';



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
const iterations = 10000;
const totalMessages = iterations * serializedMsgs.length;


describe('Codec deserialization benchmark', () => {
    const protocolData = uploadShema('./messgen/test_proto/protocol.json');
    const codec = new Codec([protocolData]);
    bench('deserialize 10,000 iterations', () => {
        const t0 = performance.now();

        for (let i = 0; i < iterations; i++) {
            for (const [msgId, msgData] of serializedMsgs) {
                codec.deserialize(protoId, msgId, new Uint8Array(msgData).buffer);
            }
        }

        const t1 = performance.now();
        const duration = (t1 - t0) / 1000;
        console.log(`Time taken: ${duration.toFixed(2)} seconds`);
        console.log(`Messages per second: ${(totalMessages / duration).toFixed(0)} msg/s`);
    });
});

