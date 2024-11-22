import { Buffer } from "../Buffer";
import { IType, IValue } from "../types";
import { Converter } from "./Converter";

export class ArrayConverter extends Converter {
    constructor(
        name: IType,
        private converter: Converter,
        private sizeConverter: Converter,
        private arraySize?: number
    ) {
        super(name);
    }

    serialize(value: Array<IValue>, buffer: Buffer): void {
        const length = value.length;
        if (this.arraySize !== undefined && length !== this.arraySize) {
            throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
        }

        if (this.arraySize === undefined) {
            this.sizeConverter.serialize(length, buffer);
        }

        for (let i = 0; i < length; i++) {
            this.converter.serialize(value[i], buffer);
        }
    }

    deserialize(buffer: Buffer): Array<IValue> {
        const length = this.arraySize ?? this.sizeConverter.deserialize(buffer);
        const result = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.converter.deserialize(buffer);
        }

        return result;
    }

    size(value: Array<IValue>): number {
        const arraySize = value.length;
        if (this.arraySize !== undefined && arraySize !== this.arraySize) {
            throw new Error(`Array length mismatch: ${arraySize} !== ${this.arraySize}`);
        }

        const size = this.arraySize === undefined ? this.sizeConverter.size(arraySize) : 0;

        return size + value.reduce((acc, item) => acc + this.converter.size(item), 0);
    }
}
