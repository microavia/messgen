import { Struct } from "./Struct";


export interface Field {
  name: IName
  type: IType
  comment?: string;
}

export interface TypeClass {
  type_class: "struct";
  comment?: string;
  fields: Field[];
}

export interface EnumValue {
  name: IName;
  value: number;
  comment: string;
}

export interface EnumTypeClass {
  type_class: "enum";
  comment: string;
  base_type: IPrimitiveType;
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


export type Messages<KEYS extends IName = IName> = {
  __id__: Struct[]
  __name__: KEYS[]
  __messages__: Record<IName, Struct>
  HEADER_STRUCT: Struct
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
export type IId = Nominal<'Id', number>
export type IPrimitiveType =
  "int8" |
  "uint8" |
  "int16" |
  "uint16" |
  "int32" |
  "uint32" |
  "int64" |
  "uint64" |
  "double" |
  "string" |
  "char"

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${IPrimitiveType}}`;

type SubType = `${ArrayDynamicSize | ArrayFixSize | MapType}` | '';


export type IType = `${IName | IPrimitiveType}${SubType}${SubType}${SubType}`


