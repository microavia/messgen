import { Struct } from "./Struct";


export type Field = {
  name: IName
  type: IType
}

export type SchemaObj = {
  id: IId
  fields: Field[]
}


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


