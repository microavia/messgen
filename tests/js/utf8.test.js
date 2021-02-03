'use strict';

import { encodeUTF8, decodeUTF8 } from '../../port/js/src/utf8.js';

describe('UTF8 function test', () => {
    it('Encoding decoding test', () => {
        let testStr = "✈✈✈ Hello world! ✈✈✈";
        let byteArr = encodeUTF8(testStr);
        let dstStr = decodeUTF8(byteArr);
        expect(testStr).toBe(dstStr);
    });
});