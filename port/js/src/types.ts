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
  proto_id: ProtocolId;
  proto_name: ProtocolName;
  types: Types;
  messages: Record<string, unknown>;
  types_map?: Record<MessageId, IName>;
  version: string;
}

export type SchemaObj = TypeClass

export type ConverterMap = Map<IType, Converter>

export type Protocol = {
  typesMap: Map<MessageId, Converter>
  typesNameToId: Record<IName, MessageId>
  converters: ConverterMap
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
export type IValue = Nominal<'Value', any>
export type ProtocolId = Nominal<'ProtocolId', number>
export type MessageId = Nominal<'MessageId', number>
export type ProtocolName = Nominal<'ProtocolName', string>


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

type SubType = ArrayDynamicSize | ArrayFixSize | MapType | '';


export type IType = `${IName | IBasicType}${SubType}${SubType}${SubType}`

export type GenericConfig = Record<string, any>

export type ExtractPayload<
  ProtocolSchema extends Record<string, Record<string, any>>,
  ProtocolName extends keyof ProtocolSchema,
  MessageType extends keyof ProtocolSchema[ProtocolName]
> = ProtocolSchema[ProtocolName][MessageType];

export type TypedArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor | BigUint64ArrayConstructor | BigInt64ArrayConstructor | Float64ArrayConstructor
export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigUint64Array | BigInt64Array | Float64Array

export type ScalarTypeDefinition = {
  type: IBasicType;
  typeClass: "scalar";
}

export type TypedArrayTypeDefinition = {
  type: IType;
  typeClass: "typed-array";
  elementType: IType;
  arraySize?: number;
}

export type ArrayTypeDefinition = {
  type: IType;
  typeClass: "array";
  elementType: IType;
  arraySize: number;
  size?: number;
}

export type MapTypeDefinition = {
  type: IType;
  typeClass: "map";
  keyType: IType;
  valueType: IType;
}

export type StructTypeDefinition = {
  typeClass: "struct";
  fields: Field[] | null;
  typeName: IName;
}

export type EnumTypeDefinition = {
  type: IType;
  typeClass: "enum";
  values: EnumValue[];
  typeName: IName;
}

export type TypeDefinition =
  ScalarTypeDefinition |
  TypedArrayTypeDefinition |
  ArrayTypeDefinition |
  MapTypeDefinition |
  StructTypeDefinition |
  EnumTypeDefinition
