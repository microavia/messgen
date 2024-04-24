'use strict'

import { encodeUTF8, decodeUTF8 } from '../src/utf8.ts'

describe('UTF8 function test', () => {
    it('Encoding decoding test', () => {
        let testStr = '✈✈✈ Hello world! ✈✈✈'
        let byteArr = encodeUTF8(testStr)
        let dstStr = decodeUTF8(byteArr)
        expect(testStr).toBe(dstStr)
    })
})
