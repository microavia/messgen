import { Buffer } from "../Buffer";
import { IType, IValue } from "../types";
import { Converter } from "./Converter";

export interface OrderedArrayType {
    elementType: IType;
    length?: number;
}

export class ArrayConverter extends Converter {
    protected elementConverter: Converter;
    protected dynamicSizeConverter: Converter;
    protected arraySize?: number;

    constructor(name: IType, elementConverter: Converter, dynamicSizeConverter: Converter, size?: number) {
        super(name);
        this.elementConverter = elementConverter;
        this.dynamicSizeConverter = dynamicSizeConverter;
        this.arraySize = size;
    }

    serialize(value: Array<IValue>, buffer: Buffer): void {
        const length = value.length;
        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
        }

        if (this.arraySize === undefined) {
            this.dynamicSizeConverter.serialize(length, buffer);
        }

        for (let i = 0; i < length; i++) {
            this.elementConverter.serialize(value[i], buffer);
        }
    }

    deserialize(buffer: Buffer): Array<IValue> {
        const length = this.arraySize ?? this.dynamicSizeConverter.deserialize(buffer);
        const result = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.elementConverter.deserialize(buffer);
        }

        return result;
    }

    size(value: Array<IValue>): number {
        const length = value.length;
        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
        }

        const totalSize = this.arraySize === undefined ?
            this.dynamicSizeConverter.size(length) :
            0;

        return totalSize + value.reduce((acc, item) => acc + this.elementConverter.size(item), 0);
    }
}