import { IType, TypedArray, TypedArrayConstructor } from "../types";
import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { OrderedArrayType } from "./ArrayConverter";
import { DYNAMIC_SIZE_TYPE } from "./NestedConverter";

export interface OrderedTypedArrayType extends OrderedArrayType {
    TypedArray: TypedArrayConstructor;
}

export class TypedArrayConverter extends Converter {
    protected elementConverter: Converter;
    protected dynamicSizeConverter: Converter;
    protected TypedArrayConstructor: any;
    protected fixedLength?: number;

    constructor(
        name: IType,
        elementConverter: Converter,
        dynamicSizeConverter: Converter,
        TypedArrayConstructor: TypedArrayConstructor,
        length?: number
    ) {
        super(name);
        this.elementConverter = elementConverter;
        this.dynamicSizeConverter = dynamicSizeConverter;
        this.TypedArrayConstructor = TypedArrayConstructor;
        this.fixedLength = length;
    }

    serialize(value: TypedArray, buffer: Buffer): void {
        const length = value.length;
        if (this.fixedLength !== undefined && length !== this.fixedLength) {
            throw new Error(`TypedArray length mismatch: ${length} !== ${this.fixedLength}`);
        }

        if (this.fixedLength === undefined) {
            this.dynamicSizeConverter.serialize(length, buffer);
        }

        if (value.buffer && buffer.offset % this.TypedArrayConstructor.BYTES_PER_ELEMENT === 0) {
            const typedArray = new this.TypedArrayConstructor(
                buffer.dataView.buffer,
                buffer.offset,
                length
            );
            typedArray.set(value);
            buffer.offset += typedArray.byteLength;
        } else {
            for (let i = 0; i < length; i++) {
                this.elementConverter.serialize(value[i], buffer);
            }
        }
    }

    deserialize(buffer: Buffer): TypedArray {
        const length = this.fixedLength ?? this.dynamicSizeConverter.deserialize(buffer);
        const size = length * this.TypedArrayConstructor.BYTES_PER_ELEMENT;

        const typedArray = new this.TypedArrayConstructor(
            buffer.dataView.buffer.slice(buffer.offset, size)
        );

        buffer.offset += typedArray.byteLength;
        return typedArray;
    }

    size(value: TypedArray): number {
        const length = value.length;
        if (this.fixedLength !== undefined && length !== this.fixedLength) {
            throw new Error(`TypedArray length mismatch: ${length} !== ${this.fixedLength}`);
        }

        const dynamicSize = this.fixedLength === undefined ?
            this.dynamicSizeConverter.size(length) :
            0;

        if (ArrayBuffer.isView(value)) {
            return dynamicSize + value.byteLength;
        }

        return dynamicSize + length * this.elementConverter.size(0);
    }
}
