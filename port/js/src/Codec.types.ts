import { Converter } from "./converters/Converter";
import { MessageId, ProtocolId, ProtocolName } from "./types";

export type GenericConfig = Record<string, Record<string, any>>;
export type TypeToNameMap = Map<ProtocolName, Map<string, Converter>>;
export type TypeToIdMap = Map<ProtocolId, Map<MessageId, Converter>>;


export type ExtractPayload<
    ProtocolSchema extends Record<string, Record<string, any>>,
    ProtocolName extends keyof ProtocolSchema,
    MessageType extends keyof ProtocolSchema[ProtocolName]
> = ProtocolSchema[ProtocolName][MessageType];

