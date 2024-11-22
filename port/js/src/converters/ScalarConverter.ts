import { i } from "vitest/dist/reporters-LqC_WI4d";
import { Buffer } from "../Buffer";
import { IValue, TypedArrayConstructor, IBasicType } from "../types";
import { Converter } from "./Converter";

const IS_LITTLE_ENDIAN = true;

export const SCALAR_TYPES = new Map<IBasicType, ScalarTypeConfig>([
    ["int8", {
        size: () => 1,
        read: (v, o) => v.getInt8(o),
        write: (v, o, a) => v.setInt8(o, a),
        default: 0,
        typedArray: true
    }],
    ["uint8", {
        size: () => 1,
        read: (v, o) => v.getUint8(o),
        write: (v, o, a) => v.setUint8(o, a),
        default: 0,
        typedArray: true
    }],
    ["int16", {
        size: () => 2,
        read: (v, o) => v.getInt16(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setInt16(o, a, IS_LITTLE_ENDIAN),
        default: 0,
        typedArray: true
    }],
    ["uint16", {
        size: () => 2,
        read: (v, o) => v.getUint16(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setUint16(o, a, IS_LITTLE_ENDIAN),
        default: 0,
        typedArray: true
    }],
    ["int32", {
        size: () => 4,
        read: (v, o) => v.getInt32(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setInt32(o, a, IS_LITTLE_ENDIAN),
        default: 0,
        typedArray: true
    }],
    ["uint32", {
        size: () => 4,
        read: (v, o) => v.getUint32(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setUint32(o, a, IS_LITTLE_ENDIAN),
        default: 0,
        typedArray: true
    }],
    ["int64", {
        size: () => 8,
        read: (v, o) => v.getBigInt64(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setBigInt64(o, BigInt(a), IS_LITTLE_ENDIAN),
        default: BigInt(0),
        typedArray: true
    }],
    ["uint64", {
        size: () => 8,
        read: (v, o) => v.getBigUint64(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setBigUint64(o, BigInt(a), IS_LITTLE_ENDIAN),
        default: BigInt(0),
        typedArray: true
    }],
    ["float32", {
        size: () => 4,
        read: (v, o) => v.getFloat32(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setFloat32(o, a, IS_LITTLE_ENDIAN),
        default: 0.0,
        typedArray: true
    }],
    ["float64", {
        size: () => 8,
        read: (v, o) => v.getFloat64(o, IS_LITTLE_ENDIAN),
        write: (v, o, a) => v.setFloat64(o, a, IS_LITTLE_ENDIAN),
        default: 0.0,
        typedArray: true
    }],
    ["bool", {
        size: () => 1,
        read: (v, o) => Boolean(v.getInt8(o)),
        write: (v, o, a) => v.setInt8(o, a ? 1 : 0),
        default: false
    }],
    ["char", {
        size: () => 1,
        read: (v, o) => String.fromCharCode(v.getUint8(o)),
        write: (v, o, a) => v.setUint8(o, a.charCodeAt(0)),
        default: ' '
    }],
    ["string", {
        size: (value: string) => value.length + 4,
        read: (v, o) => {
            const length = v.getUint32(o, IS_LITTLE_ENDIAN);
            o += 4;
            return new TextDecoder().decode(new Uint8Array(v.buffer, v.byteOffset + o, length));
        },
        write: (v, o, a) => {
            const encoded = new TextEncoder().encode(a);
            v.setUint32(o, encoded.length, IS_LITTLE_ENDIAN);
            o += 4;
            new Uint8Array(v.buffer, v.byteOffset + o).set(encoded);
            return encoded.length + 4;
        },
        default: ''
    }],
    ["bytes", {
        size: (value: Uint8Array) => value.length + 4,
        read: (v, o) => {
            const length = v.getUint32(o, IS_LITTLE_ENDIAN);
            o += 4;
            return new Uint8Array(v.buffer, v.byteOffset + o, length);
        },
        write: (v, o, a) => {
            v.setUint32(o, a.length, IS_LITTLE_ENDIAN);
            o += 4;
            new Uint8Array(v.buffer, v.byteOffset + o).set(a);
            return a.length + 4;
        },
        default: new Uint8Array(0)
    }
    ]
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
        this.config.write(buffer.dataView, buffer.offset, value);
        buffer.offset += this.config.size(value);
    }

    deserialize(buffer: Buffer): IValue {
        const value = this.config.read(buffer.dataView, buffer.offset);
        buffer.offset += this.config.size(value);
        return value;
    }

    size(value: IValue): number {
        return this.config.size(value);
    }

    default(): IValue {
        return this.config.default;
    }
}


interface ScalarTypeConfig {
    size: (value?: IValue) => number;
    read: (v: DataView, offset: number) => IValue;
    write: (v: DataView, offset: number, value: IValue) => void;
    default: IValue;
    typedArray?: boolean;
}