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
  proto_id: number;
  types: Types;
  messages: Record<string, unknown>;
  types_map: Record<string, string>;
  version: string;
}

export type SchemaObj = TypeClass


export type Messages = {
  typesMap: Map<number, Converter>
  converters: Map<IType, Converter>
}


export type Obj = Record<string, any>;


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
export type IValue = Nominal<'Value', any>
export type IId = Nominal<'Id', number>

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
  "char"

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${IBasicType}}`;

type SubType = `${ArrayDynamicSize | ArrayFixSize | MapType}` | '';


export type IType = `${IName | IBasicType}${SubType}${SubType}${SubType}`

