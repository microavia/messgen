import { IType, IValue } from "../types";
import { Converter } from "./Converter";
import { Buffer } from "../Buffer";


export interface OrderedArrayType {
    elementType: IType;
    length?: number;
}

export class ArrayConverter extends Converter {
    protected elementConverter: Converter;
    protected dynamicSizeConverter: Converter;
    protected fixedLength?: number;

    constructor(name: IType, elementConverter: Converter, dynamicSizeConverter: Converter, length?: number) {
        super(name);
        this.elementConverter = elementConverter;
        this.dynamicSizeConverter = dynamicSizeConverter;
        this.fixedLength = length;
    }

    serialize(value: Array<IValue>, buffer: Buffer): void {
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

    deserialize(buffer: Buffer): Array<IValue> {
        const length = this.fixedLength ?? this.dynamicSizeConverter.deserialize(buffer);
        const result = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.elementConverter.deserialize(buffer);
        }

        return result;
    }

    size(value: Array<IValue>): number {
        const length = value.length;
        if (this.fixedLength !== undefined && length !== this.fixedLength) {
            throw new Error(`Array length mismatch: ${length} !== ${this.fixedLength}`);
        }

        let totalSize = this.fixedLength === undefined ?
            this.dynamicSizeConverter.size(length) :
            0;

        return totalSize + value.reduce((acc, item) => acc + this.elementConverter.size(item), 0);
    }
}