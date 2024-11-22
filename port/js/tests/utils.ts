import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { ProtocolJSON } from "../src/types";
import { ConverterFactory } from "../src/converters/ConverterFactory";
import { Protocols } from "../src/converters/Protocols";

export function uploadShema(filePath: string): ProtocolJSON {
    const protocolPath = path.resolve(__dirname, filePath);
    const rawData = fs.readFileSync(protocolPath, 'utf8');
    return JSON.parse(rawData) as ProtocolJSON;
}

export function uploadBinary(filePath: string): Buffer {
    const binaryPath = path.resolve(__dirname, filePath);
    return fs.readFileSync(binaryPath);
}

export function generateTestData() {
    execSync('npm run gen-json')
}

export function initGetType() {
    const protocol = new Protocols([]);
    const factory = new ConverterFactory(protocol);
    return factory.toConverter.bind(factory);
}

