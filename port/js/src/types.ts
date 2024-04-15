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
  HEADER_STRUCT: Struct
} &
  Record<IName, Struct>


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


export type IName = Nominal<'Name', string>
export type IId = Nominal<'Id', number>
export type IPrimitiveType =
  "Int8" |
  "Uint8" |
  "Int16" |
  "Uint16" |
  "Int32" |
  "Uint32" |
  "Int64" |
  "Uint64" |
  "String" |
  "Double" |
  "Char"

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${'string' | 'number'}`;

type SubType = `${ArrayDynamicSize | ArrayFixSize}` | '';


export type IType = `${IName | IPrimitiveType}${SubType}${SubType}${SubType}`


