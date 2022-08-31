export type Field = {
  name: string
  type: string
}

export type Schema = {
  id: number
  fields: Field[]
}


export class Struct {
  get schema(): Schema
  
  get id(): number
  
  get size(): number
  
  get fields(): Field[]
  
  set(schema: Schema): void
}


declare type Messages<KEYS extends string> = {
  __id__: Struct[]
  __name__: KEYS[]
} &
  Record<KEYS, Struct> &
  addPrefixToObject<UppercaseObjectKeys<Record<KEYS, Struct>>, 'MSG_'> &
  Record<string, Struct>;

export const HEADER_STRUCT: Struct

type Obj = Record<string, any>;

export class Buffer {
  static deserialize(messages, data, headerStruct?: Struct, includeMessages?: Messages<string>)
  
  static mergeArrayBuffers(tArrs: Array<unknown>, type: Uint8ArrayConstructor): Uint8Array
  
  static appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): Uint8Array
  
  static calcSize(fields: Field[], includeMessages?: Messages<string>)
  
  static createValueArray(schemaFields: Schema["fields"], obj: Obj, includeMessages?: Messages<string>)
  
  static serializeMessage(struct: Struct, obj: Obj, headerStruct ?: Struct, includeMessages?: Messages<string>): Uint8Array
  
  static serializeObj(schemaFields: Schema["fields"], obj: Obj, includeMessages?: Messages<string>)
  
  static writeDataView(fields: Field[], dataView, includeMessages?: Messages<string>, offset ?: number)
  
  static serialize(fields: Field[], includeMessages?: Messages<string>)
  
  get size(): number
  
  get dataView(): DataView
  
  set(arrayBuffer: ArrayBufferLike): void
  
  deserialize(struct: Struct, offset?: number, sizeOffset?: number): Obj
  
}

export function initializeMessages<KEYS extends string>(
  messagesJson: Record<KEYS, Schema>,
  headerSchema?: Schema
): Messages<KEYS>

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
