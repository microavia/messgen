import { Converter } from "./Converter";
import { Buffer } from "../Buffer";
import { IName, TypeClass, IType, IValue } from "../types";

export class StructConverter extends Converter {
  convertorsList: { converter: Converter, name: string }[] = [];
  reservedWords: string[] = Object.getOwnPropertyNames(Object.prototype);
  parentObject: Record<IName, IValue>
  
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
      
      if (this.reservedWords.includes(field.name)) {
        throw new Error(`Field ${field.name} is a reserved word in JavaScript`);
      }
      
      let converter = this.converters.get(field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found in ${this.name}`);
      }
      
      this.convertorsList.push({ converter, name: field.name });
    })
    
    this.parentObject = Object.fromEntries(
      this.convertorsList.map(({ name, converter }) => [name, converter.default()])
    )
  }
  
  
  serialize(value: IValue, buffer: Buffer) {
    this.convertorsList.forEach(({ converter, name }) => {
      let data = value[name];
      if (
        data === null || data === undefined
      ) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }
      converter.serialize(data, buffer);
    })
  }
  
  size(value: IValue): number {
    return this.convertorsList.reduce((acc, { converter, name }) => {
      let data = value[name];
      if (
        data === null || data === undefined
      ) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }

      return acc + converter.size(data);
    }, 0)
  }
  
  deserialize(buffer: Buffer): IValue {
    return this.convertorsList.reduce((acc, { converter, name }) => {
      acc[name] = converter.deserialize(buffer);
      return acc;
    }, {} as Record<IName, IValue>)
    
  }
  
  default(): IValue {
    return this.parentObject;
  }
}
