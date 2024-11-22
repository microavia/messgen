import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { IType, TypedArray, TypedArrayConstructor } from "../types";

export class TypedArrayConverter extends Converter {
    private elementConverter: Converter;
    private dynamicSizeConverter: Converter;
    private TypedArrayConstructor: TypedArrayConstructor;
    private arraySize?: number;

    constructor(
        name: IType,
        elementConverter: Converter,
        dynamicSizeConverter: Converter,
        TypedArrayConstructor: TypedArrayConstructor,
        arraySize?: number
    ) {
        super(name);
        this.elementConverter = elementConverter;
        this.dynamicSizeConverter = dynamicSizeConverter;
        this.TypedArrayConstructor = TypedArrayConstructor;
        this.arraySize = arraySize;
    }

    serialize(value: TypedArray, buffer: Buffer): void {
        const length = value.length;
        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`TypedArray length mismatch: ${length} !== ${this.arraySize}`);
        }

        if (this.arraySize === undefined) {
            this.dynamicSizeConverter.serialize(length, buffer);
        }

        for (let i = 0; i < length; i++) {
            this.elementConverter.serialize(value[i], buffer);
        }
    }

    deserialize(buffer: Buffer): TypedArray {
        const length = this.arraySize ?? this.dynamicSizeConverter.deserialize(buffer);
        const result = new this.TypedArrayConstructor(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.elementConverter.deserialize(buffer);
        }

        return result;
    }


    size(value: TypedArray): number {
        const length = value.length;
        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`TypedArray length mismatch: ${length} !== ${this.arraySize}`);
        }

        const dynamicSize = this.arraySize === undefined ?
            this.dynamicSizeConverter.size(length) :
            0;

        return dynamicSize + value.byteLength;
    }
}
