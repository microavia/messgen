import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { IName, TypeClass, IType, IValue } from "../types";

export class StructConverter extends Converter {
  constructor(
    name: IName,
    private schema: TypeClass,
    private converters: Map<IType, Converter>
  ) {
    super(name);
    schema.fields?.forEach((field, index) => {
      if (schema.fields?.slice(index + 1).some((f) => f.name === field.name)) {
        throw new Error(`Field ${field.name} is duplicated in ${this.name}`);
      }
    })
  }
  
  serialize(value: IValue, buffer: Buffer) {
    this.schema.fields?.forEach((field) => {
      // TODO: move to constructor
      let converter = this.converters.get(field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found in ${this.name}`);
      }
      let data = value[field.name];
      if (
        data == null || data == undefined
      ) {
        throw new Error(`Field ${field.name} is not found in ${this.name}`);
      }
      
      converter.serialize(data, buffer);
    })
    
  }
  
  size(value: IValue): number {
    return this.schema.fields?.reduce((acc, field) => {
      // TODO: move to constructor
      let converter = this.converters.get(field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found in ${this.name}`);
      }
      let data = value[field.name];
      if (
        data == null || data == undefined
      ) {
        throw new Error(`Field ${field.name} is not found in ${this.name}`);
      }
      
      return acc + converter.size(data);
    }, 0) || 0
  }
  
  deserialize(buffer: Buffer): IValue {
    return this.schema.fields?.reduce((acc, field) => {
      // TODO: move to constructor
      let converter = this.converters.get(field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found`);
      }
      acc[field.name] = converter.deserialize(buffer);
      return acc;
    }, {} as Record<IName, IValue>) || {}
  }
}
