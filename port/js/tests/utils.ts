import path from "path";
import fs from "fs";
import { GlobalBasicConverters } from "../src/converters/BasicConverter";
import { Converter } from "../src/converters/Converter";
import { IType, ProtocolJSON } from "../src/types";

export function initializeBasicConverter() {
    return new Map<IType, Converter>(GlobalBasicConverters);
}



export function uploadShema(filePath: string): ProtocolJSON {
    const protocolPath = path.resolve(__dirname, filePath);
    const rawData = fs.readFileSync(protocolPath, 'utf8');
    return JSON.parse(rawData) as ProtocolJSON;
}

export function uploadBinary(filePath: string): Buffer {
    const binaryPath = path.resolve(__dirname, filePath);
    return fs.readFileSync(binaryPath);
}