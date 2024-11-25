import * as path from 'path';
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { ConverterFactory } from "../src/converters/ConverterFactory";
import { ProtocolJSON } from "../src/protocol/Protocols.types";
import { Protocols } from "../src/protocol/Protocols";

export function uploadShema(filePath: string): ProtocolJSON {
    const protocolPath = path.resolve(__dirname, filePath);
    const rawData = readFileSync(protocolPath, 'utf8');
    return JSON.parse(rawData) as ProtocolJSON;
}

export function uploadBinary(filePath: string): Buffer {
    const binaryPath = path.resolve(__dirname, filePath);
    return readFileSync(binaryPath);
}

export function generateTestData() {
    execSync('npm run gen-json')
}

export function initGetType() {
    const protocol = new Protocols([]);
    const factory = new ConverterFactory(protocol);
    return factory.toConverter.bind(factory);
}

