import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { IType, TypedArray, TypedArrayConstructor } from "../types";

export class TypedArrayConverter extends Converter {
    constructor(
        name: IType,
        private converter: Converter,
        private sizeConverter: Converter,
        private TypedArrayConstructor: TypedArrayConstructor,
        private arraySize?: number
    ) {
        super(name);
    }

    serialize(value: TypedArray, buffer: Buffer): void {
        const arraySize = value.length;
        if (this.arraySize !== undefined && arraySize !== this.arraySize) {
            throw new Error(`TypedArray length mismatch: ${arraySize} !== ${this.arraySize}`);
        }

        if (this.arraySize === undefined) {
            this.sizeConverter.serialize(arraySize, buffer);
        }

        for (let i = 0; i < arraySize; i++) {
            this.converter.serialize(value[i], buffer);
        }
    }

    deserialize(buffer: Buffer): TypedArray {
        const arraySize = this.arraySize ?? this.sizeConverter.deserialize(buffer);
        const result = new this.TypedArrayConstructor(arraySize);

        for (let i = 0; i < arraySize; i++) {
            result[i] = this.converter.deserialize(buffer);
        }

        return result;
    }


    size(value: TypedArray): number {
        const arraySize = value.length;
        if (this.arraySize !== undefined && arraySize !== this.arraySize) {
            throw new Error(`TypedArray length mismatch: ${arraySize} !== ${this.arraySize}`);
        }

        const size = this.arraySize === undefined ? this.sizeConverter.size(arraySize) : 0;
        return size + value.byteLength;
    }
}
