import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { ArrayTypeDefinition, IType, TypedArray, TypedArrayConstructor, TypedArrayTypeDefinition } from "../types";
import { GetType } from "./ConverterFactory";

const TYPED_ARRAY_MAP = new Map<IType, TypedArrayConstructor>([
    ["int8", Int8Array],
    ["uint8", Uint8Array],
    ["int16", Int16Array],
    ["uint16", Uint16Array],
    ["int32", Int32Array],
    ["uint32", Uint32Array],
    ["int64", BigInt64Array],
    ["uint64", BigUint64Array],
    ["float32", Float32Array],
    ["float64", Float64Array],
]);

export class TypedArrayConverter extends Converter {
    private converter: Converter;
    private sizeConverter: Converter;
    private arraySize?: number;
    private TypedArrayConstructor: TypedArrayConstructor;

    constructor(protocolName: string, typeDef: TypedArrayTypeDefinition, getType: GetType) {
        super(typeDef.type);
        this.converter = getType(protocolName, typeDef.elementType);
        this.sizeConverter = getType(protocolName, "uint32");
        this.arraySize = typeDef.arraySize;

        const arrayConstructor = TYPED_ARRAY_MAP.get(typeDef.elementType);

        if (!arrayConstructor) {
            throw new Error(`Unknown typed array type: ${typeDef.elementType}`);
        }
        this.TypedArrayConstructor = arrayConstructor;
    }

    serialize(value: TypedArray, buffer: Buffer): void {
        const length = value.length;

        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
        }

    }

    deserialize(buffer: Buffer): TypedArray {
        const length = this.arraySize ?? this.sizeConverter.deserialize(buffer);

        const result = new this.TypedArrayConstructor(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.converter.deserialize(buffer);
        }

        return result;
    }
    size(value: TypedArray): number {
        const length = value.length;

        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
        }

        let totalSize = 0;

        if (this.arraySize === undefined) {
            totalSize += this.sizeConverter.size(length);
        }

        for (let i = 0; i < length; i++) {
            totalSize += this.converter.size(value[i]);
        }

        return totalSize;
    }
}