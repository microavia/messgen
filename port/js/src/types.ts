import { Struct } from "./Struct";


export type Field = {
  name: IName
  type: IType
}

export type SchemaObj = {
  id: IId
  fields: Field[]
}


export type Messages<KEYS extends string> = {
  __id__: Struct[]
  __name__: KEYS[]
} &
  Record<KEYS, Struct> &
  addPrefixToObject<UppercaseObjectKeys<Record<KEYS, Struct>>, 'MSG_'> &
  Record<string, Struct>;


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


/*
    ____,-------------------------------,____
    \   |            HELPERS            |   /
    /___|-------------------------------|___\

*/


// https://stackoverflow.com/questions/71824852/convert-typescript-object-keys-to-uppercase
// All string-type keys in the object, and then uppercased
type UppercaseStringKeys<T> = Uppercase<Extract<keyof T, string>>;
// An object consisting of the above keys with the same values from the original object
type UppercaseObjectKeys<T extends { [key: string | number | symbol]: any }> = {
  [x in UppercaseStringKeys<T>]: x extends string ? T[Lowercase<x>] : T[x];
};
// https://stackoverflow.com/questions/57510388/define-prefix-for-object-keys-using-types-in-typescript
type addPrefixToObject<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
}
