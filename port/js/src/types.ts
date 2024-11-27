/*
    ____,-------------------------------------,____
    \   |            Nominal types            |   /
    /___|-------------------------------------|___\

*/
declare const NominalType: unique symbol;
// String-typed unique nominal types generator:
//
// let a: NominalStrict<'DateTime'> = '2021-10-26T13:53:05.997Z';
// let b: NominalStrict<'DayDate'> = '2021-10-26';
// a = b; - compile-time error;
export type NominalStrict<NAME extends string | number, Type = string> = Type & { [NominalType]: NAME };
export type Nominal<NAME extends string | number, Type = string> = Type & { [NominalType]?: NAME };

export type IName = string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IValue = Nominal<'Value', any>;
export type ProtocolId = Nominal<'ProtocolId', number>;
export type MessageId = Nominal<'MessageId', number>;
export type ProtocolName = Nominal<'ProtocolName', string>;

export type INumberType =
  'uint8' |
  'int8' |
  'uint16' |
  'int16' |
  'uint32' |
  'int32' |
  'uint64' |
  'int64' |
  'float32' |
  'float64';

export type IBasicType =
  INumberType |
  'string' |
  'bool' |
  'char' |
  'bytes';

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${IBasicType}}`;

type SubType = ArrayDynamicSize | ArrayFixSize | MapType | '';

export type IType = `${IName | IBasicType}${SubType}${SubType}${SubType}`;

export interface Field {
  name: IName
  type: IType
}

export interface EnumValue {
  name: IName;
  value: number;
  comment?: string;
}

export type ScalarTypeDefinition = {
  type: IBasicType;
  typeClass: 'scalar';
};

export type TypedArrayTypeDefinition = {
  type: IType;
  typeClass: 'typed-array';
  elementType: IType;
  arraySize?: number;
};

export type ArrayTypeDefinition = {
  type: IType;
  typeClass: 'array';
  elementType: IType;
  arraySize?: number;
  size?: number;
};

export type MapTypeDefinition = {
  type: IType;
  typeClass: 'map';
  keyType: IType;
  valueType: IType;
};

export type StructTypeDefinition = {
  typeClass: 'struct';
  fields: Field[] | null;
  typeName: IName;
};

export type EnumTypeDefinition = {
  type: IType;
  typeClass: 'enum';
  values: EnumValue[];
  typeName: IName;
};

export type TypeDefinition =
  ScalarTypeDefinition |
  TypedArrayTypeDefinition |
  ArrayTypeDefinition |
  MapTypeDefinition |
  StructTypeDefinition |
  EnumTypeDefinition;
