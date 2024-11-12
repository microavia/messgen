import { Converter } from "./converters/Converter";


export interface Field {
  name: IName
  type: IType
  comment?: string;
}

export interface TypeClass {
  type_class: "struct";
  comment?: string;
  fields: Field[] | null;
}

export interface EnumValue {
  name: IName;
  value: number;
  comment?: string;
}

export interface EnumTypeClass {
  type_class: "enum";
  comment?: string;
  base_type: INumberType;
  values: EnumValue[];
}

export interface Types {
  [key: string]: TypeClass | EnumTypeClass;
}

export interface ProtocolJSON {
  proto_id: IProtocolId;
  proto_name: IProtocolName;
  types: Types;
  messages: Record<string, unknown>;
  types_map?: Record<ITypeId, IName>;
  version: string;
}

export type SchemaObj = TypeClass


export type Protocol = {
  typesMap: Map<ITypeId, Converter>
  typesNameToId: Record<IName, ITypeId>
  converters: Map<IType, Converter>
  protocol: ProtocolJSON
}


/*
    ____,-------------------------------------,____
    \   |            Nominal types            |   /
    /___|-------------------------------------|___\

*/
declare const NominalType: unique symbol
// String-typed unique nominal types generator:
//
// let a: NominalStrict<'DateTime'> = '2021-10-26T13:53:05.997Z';
// let b: NominalStrict<'DayDate'> = '2021-10-26';
// a = b; - compile-time error;
export type NominalStrict<NAME extends string | number, Type = string> = Type & { [NominalType]: NAME }
export type Nominal<NAME extends string | number, Type = string> = Type & { [NominalType]?: NAME }


export type IName = string
export type ITypeId = Nominal<'TypeId', number>
export type IValue = Nominal<'Value', any>
export type IProtocolId = Nominal<'ProtocolId', number>
export type IProtocolName = Nominal<'IProtocolName', string>


export type INumberType =
  "uint8" |
  "int8" |
  "uint16" |
  "int16" |
  "uint32" |
  "int32" |
  "uint64" |
  "int64" |
  "float32" |
  "float64"

export type IBasicType =
  INumberType |
  "string" |
  "bool" |
  "char" |
  'bytes'

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${IBasicType}}`;

type SubType = `${ArrayDynamicSize | ArrayFixSize | MapType}` | '';


export type IType = `${IName | IBasicType}${SubType}${SubType}${SubType}`

export type GetProtocolPayload<
  ProtocolMap extends Record<string, Record<string, any>>,
  Name extends keyof ProtocolMap,
  Type extends keyof ProtocolMap[Name]
> = ProtocolMap[Name][Type];

export type BaseProtocolMap = Record<string, any>