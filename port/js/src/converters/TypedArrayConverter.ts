import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { IType, IValue, TypedArray } from "../types";
import { ConverterMap } from "../types";

export class TypedArrayConverter extends Converter {
    private elementConverter: Converter;
    private dynamicSizeConverter: Converter;
    private TypedArrayConstructor: any;
    private fixedLength?: number;

    constructor(
        name: IType,
        elementConverter: Converter,
        dynamicSizeConverter: Converter,
        TypedArrayConstructor: any,
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
            throw new Error(`Array length mismatch: ${length} !== ${this.fixedLength}`);
        }

        if (this.fixedLength === undefined) {
            this.dynamicSizeConverter.serialize(length, buffer);
        }

        for (let i = 0; i < length; i++) {
            this.elementConverter.serialize(value[i], buffer);
        }
    }

    deserialize(buffer: Buffer): TypedArray {
        const length = this.fixedLength ?? this.dynamicSizeConverter.deserialize(buffer);

        const result = new this.TypedArrayConstructor(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.elementConverter.deserialize(buffer);
        }

        return result;
    }
    size(value: TypedArray): number {
        const length = value.length;

        if (this.fixedLength !== undefined && length !== this.fixedLength) {
            throw new Error(`Array length mismatch: ${length} !== ${this.fixedLength}`);
        }

        let totalSize = 0;

        if (this.fixedLength === undefined) {
            totalSize += this.dynamicSizeConverter.size(length);
        }

        for (let i = 0; i < length; i++) {
            totalSize += this.elementConverter.size(value[i]);
        }

        return totalSize;
    }
}