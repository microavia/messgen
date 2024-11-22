import { EnumValue, Field, IName, INumberType, IType, MessageId, ProtocolId, ProtocolName, TypeDefinition } from "../types";




export interface TypeClass {
    type_class: "struct";
    comment?: string;
    fields: Field[] | null;
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

export interface Protocol {
    id: ProtocolId;
    name: ProtocolName;
    types: Map<string, TypeDefinition>;
    messageIds: Map<string, MessageId>;
}

export type StructureType = TypeClass | EnumTypeClass