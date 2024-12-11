import type { IName, INumberType, MessageId, ProtocolId, ProtocolName, TypeDefinition, Field } from '../types';

interface EnumValue {
  name: IName;
  value: number;
}

export interface TypeClass {
  type_class: 'struct';
  comment?: string;
  fields: Field[] | null;
}

export interface EnumTypeClass {
  type_class: 'enum';
  comment?: string;
  base_type: INumberType;
  values: EnumValue[];
}

export interface Types {
  [key: string]: TypeClass | EnumTypeClass;
}

export interface ProtocolJSON {
  proto_id: ProtocolId;
  proto_name: ProtocolName;
  types: Types;
  types_map?: Record<MessageId, IName>;
  version: string;
}

export interface ProtocolConfig {
  id: ProtocolId;
  name: ProtocolName;
  types: Map<string, TypeDefinition>;
  messageIds: Map<string, MessageId>;
}

export type StructureType = TypeClass | EnumTypeClass;
