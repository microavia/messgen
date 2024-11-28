import type { Buffer } from '../../Buffer';
import type { IValue, IBasicType } from '../../types';
import { Converter } from './../Converter';
import { IS_LITTLE_ENDIAN } from '../../config';
import { decodeUTF8, encodeUTF8 } from '../../utils/utf8';

interface ScalarTypeConfig {
  size: number | ((value: IValue) => number);
  read: (v: DataView, offset: number) => IValue;
  write: (v: DataView, offset: number, value: IValue) => void;
  default: IValue;
  typedArray?: boolean;
}

export const SCALAR_TYPES = new Map<IBasicType, ScalarTypeConfig>([
  ['int8', {
    size: 1,
    read: (v, o) => v.getInt8(o),
    write: (v, o, a) => v.setInt8(o, a as number),
    default: 0,
  }],
  ['uint8', {
    size: 1,
    read: (v, o) => v.getUint8(o),
    write: (v, o, a) => v.setUint8(o, a as number),
    default: 0,
  }],
  ['int16', {
    size: 2,
    read: (v, o) => v.getInt16(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setInt16(o, a as number, IS_LITTLE_ENDIAN),
    default: 0,
  }],
  ['uint16', {
    size: 2,
    read: (v, o) => v.getUint16(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setUint16(o, a as number, IS_LITTLE_ENDIAN),
    default: 0,
  }],
  ['int32', {
    size: 4,
    read: (v, o) => v.getInt32(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setInt32(o, a as number, IS_LITTLE_ENDIAN),
    default: 0,
  }],
  ['uint32', {
    size: 4,
    read: (v, o) => v.getUint32(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setUint32(o, a as number, IS_LITTLE_ENDIAN),
    default: 0,
  }],
  ['int64', {
    size: 8,
    read: (v, o) => v.getBigInt64(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setBigInt64(o, BigInt(a), IS_LITTLE_ENDIAN),
    default: BigInt(0),
  }],
  ['uint64', {
    size: 8,
    read: (v, o) => v.getBigUint64(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setBigUint64(o, BigInt(a), IS_LITTLE_ENDIAN),
    default: BigInt(0),
  }],
  ['float32', {
    size: 4,
    read: (v, o) => v.getFloat32(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setFloat32(o, a as number, IS_LITTLE_ENDIAN),
    default: 0.0,
  }],
  ['float64', {
    size: 8,
    read: (v, o) => v.getFloat64(o, IS_LITTLE_ENDIAN),
    write: (v, o, a) => v.setFloat64(o, a as number, IS_LITTLE_ENDIAN),
    default: 0.0,
  }],
  ['bool', {
    size: 1,
    read: (v, o) => Boolean(v.getUint8(o)),
    write: (v, o, a) => v.setUint8(o, (a as boolean) ? 1 : 0),
    default: false,
  }],
  ['char', {
    size: 1,
    read: (v, o) => String.fromCharCode(v.getUint8(o)),
    write: (v, o, a) => v.setUint8(o, (a as string).charCodeAt(0)),
    default: ' ',
  }],
  ['string', {
    size: (value: string) => value.length + 4,
    read: (v, s) => decodeUTF8(new Uint8Array(v.buffer, s + 4, v.getUint32(s, IS_LITTLE_ENDIAN))),
    write: (v, s, a: string) => {
      const size = a.length;
      v.setUint32(s, size, IS_LITTLE_ENDIAN);
      const uint8View = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      uint8View.set(encodeUTF8(a), s + 4);

      return size + 4;
    },
    default: () => '',
  }],
  ['bytes', {
    size: (value: IValue) => {
      const { length } = (value as Uint8Array);
      return 4 + length;
    },
    read: (v, o) => {
      const length = v.getUint32(o, IS_LITTLE_ENDIAN);
      o += 4;
      return new Uint8Array(v.buffer, v.byteOffset + o, length);
    },
    write: (v, o, a) => {
      const bytes = a as Uint8Array;
      v.setUint32(o, bytes.length, IS_LITTLE_ENDIAN);
      o += 4;
      new Uint8Array(v.buffer, v.byteOffset + o, bytes.length).set(bytes);
    },
    default: new Uint8Array(0),
  }],
]);

export class ScalarConverter extends Converter {
  private config: ScalarTypeConfig;

  constructor(name: IBasicType) {
    super(name);

    const config = SCALAR_TYPES.get(name);
    if (!config) {
      throw new Error(`Unsupported scalar type "${name}"`);
    }

    this.config = config;
  }

  serialize(value: IValue, buffer: Buffer): void {
    const { config } = this;

    this.config.write(buffer.dataView, buffer.offset, value);

    if (typeof config.size === 'number') {
      buffer.offset += config.size;
    } else {
      buffer.offset += config.size(value);
    }
  }

  deserialize(buffer: Buffer): IValue {
    const value = this.config.read(buffer.dataView, buffer.offset);

    if (typeof this.config.size === 'number') {
      buffer.offset += this.config.size;
    } else {
      buffer.offset += this.config.size(value);
    }

    return value;
  }

  size(value: IValue): number {
    if (typeof this.config.size === 'number') {
      return this.config.size;
    }
    return this.config.size(value);
  }

  default(): IValue {
    return this.config.default;
  }
}
