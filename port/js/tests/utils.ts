import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { GlobalBasicConverters } from "../src/converters/BasicConverter";
import { Converter } from "../src/converters/Converter";
import { IType, ProtocolJSON } from "../src/types";

export function initializeBasicConverter() {
    return new Map<IType, Converter>(GlobalBasicConverters);
}

export function uploadShema(jsonPath: string): ProtocolJSON {
    const protocolPath = path.resolve(__dirname, jsonPath);
    const rawData = fs.readFileSync(protocolPath, 'utf8');
    return JSON.parse(rawData) as ProtocolJSON;
}


export function generateTestData() {
    execSync('npm run gen-json')
}
