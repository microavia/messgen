import { TypeClass, IType, IProtocolId, ITypeId } from "./types";
import { StructConverter } from "./converters/StructConverter";
import { Buffer } from "./Buffer";
import { Converter } from "./converters/Converter";
import { GlobalBasicConverters } from "./converters/BasicConverter";


export const HEADER_STRUCT = {
  "type_class": "struct",
  fields: [
    { name: "message_id", type: "uint8" },
    { name: "protocol_id", type: "uint8" },
    { name: 'size', type: 'uint32' },
  ]
} satisfies TypeClass;


export type IHeaderNames = 'message_id' | 'protocol_id' | 'size';

export interface IHeader {
  message_id: ITypeId;
  protocol_id: IProtocolId;
  size: number;
}

export interface IHeaderConverter extends StructConverter {
  deserialize(buffer: Buffer): Record<string, any> & IHeader;
  
  serialize(value: Record<string, any> & IHeader, buffer: Buffer): void;
}

export const headerConverter: IHeaderConverter = new StructConverter(
  'head',
  HEADER_STRUCT,
  new Map<IType, Converter>(GlobalBasicConverters)
)

