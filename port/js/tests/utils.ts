import { GlobalBasicConverters } from "../src/converters/BasicConverter";
import { Converter } from "../src/converters/Converter";
import { IType } from "../src/types";

export function initializeBasicConverter() {
    return new Map<IType, Converter>(GlobalBasicConverters);
}