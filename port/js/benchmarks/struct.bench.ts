import { performance } from 'perf_hooks';
import { Messgen } from "../src/Messgen";
import { uploadShema, uploadBinary } from "../tests/utils";
import { bench, describe } from 'vitest';

const protocolData = uploadShema('./messgen/test_proto/protocol.json');
const codec = new Messgen([protocolData]);

const serializedMsgs = [
    ['simple_struct', uploadBinary('../../../tests/serialized_data/bin/simple_struct.bin')],
    ['var_size_struct', uploadBinary('../../../tests/serialized_data/bin/var_size_struct.bin')],
    ['struct_with_enum', uploadBinary('../../../tests/serialized_data/bin/struct_with_enum.bin')],
    ['empty_struct', uploadBinary('../../../tests/serialized_data/bin/empty_struct.bin')],
    ['complex_struct_with_empty', uploadBinary('../../../tests/serialized_data/bin/complex_struct_with_empty.bin')],
    ['complex_struct_nostl', uploadBinary('../../../tests/serialized_data/bin/complex_struct_nostl.bin')],
    ['flat_struct', uploadBinary('../../../tests/serialized_data/bin/flat_struct.bin')],
] as unknown as [string, Buffer][];


const protoId = 'messgen/test_proto';
const iterations = 10000;
const totalMessages = iterations * serializedMsgs.length;


describe('Codec deserialization benchmark', () => {
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

