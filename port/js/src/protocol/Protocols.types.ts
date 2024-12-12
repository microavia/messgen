import type { IName, INumberType, Field } from '../types';

export interface RawStructType {
  type: string;
  type_class: '8'
  fields: Field[];
}

export interface RawEnumType {
  type: string;
  type_class: '7';
  base_type: INumberType;
  values: EnumValue[];
}

export type RawType = RawStructType | RawEnumType;

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

export type StructureType = TypeClass | EnumTypeClass;

export interface Protocol {
  name: string;
  proto_id: number;
  types: Record<string, IName>;
}
