import { IBasicType, IName, IType, ProtocolName, TypeDefinition } from "../types";
import { ProtocolConfig, ProtocolJSON, StructureType } from "./Protocol.types";


const SCALAR_TYPES_INFO = new Map<string, boolean>([
    ["int8", true],
    ["uint8", true],
    ["int16", true],
    ["uint16", true],
    ["int32", true],
    ["uint32", true],
    ["int64", true],
    ["uint64", true],
    ["float32", true],
    ["float64", true],
    ["char", false],
    ["string", false],
    ["bytes", false],
    ["bool", false]
]);

export class Protocol {
    private static SEPARATOR = "/";
    private protocols = new Map<ProtocolName, ProtocolConfig>();

    constructor(jsons: ProtocolJSON[]) {
        for (const json of jsons) {
            const types = new Map(Object.entries(json.types)
                .map(([name, info]) => [name, this.resiolveHeadtypes(name, info)]))

            const messageIds = new Map(Object.entries(json.types_map || {}).map(([id, name]) => [name, parseInt(id)]));

            this.protocols.set(json.proto_name, {
                id: json.proto_id,
                name: json.proto_name,
                types,
                messageIds,
            } as ProtocolConfig);
        }
    }

    getProtocols() {
        return this.protocols;
    }

    private resiolveHeadtypes(name: IName, definition: StructureType): TypeDefinition {
        if (definition.type_class === "struct") {
            return {
                typeClass: 'struct',
                fields: definition.fields,
                typeName: name,
            }
        }
        return {
            typeClass: "enum",
            type: definition.base_type,
            typeName: name,
            values: definition.values
        }

    }

    getType(currProtoName: ProtocolName, typeName: IType): TypeDefinition {
        if (SCALAR_TYPES_INFO.has(typeName)) {
            return {
                type: typeName as IBasicType,
                typeClass: "scalar"
            };
        }

        if (typeName.endsWith("]")) {
            const [elementType, size] = this.parseArrayType(typeName);

            if (SCALAR_TYPES_INFO.get(elementType)) {
                return {
                    type: typeName,
                    typeClass: "typed-array",
                    elementType,
                    arraySize: size
                };
            }

            return {
                type: typeName,
                typeClass: "array",
                elementType,
                arraySize: size
            };
        }

        if (typeName.endsWith("}")) {
            const [valueType, keyType] = this.parseMapType(typeName);
            return {
                type: typeName,
                typeClass: "map",
                keyType,
                valueType
            };
        }


        const [, type] = this.resolveType(currProtoName, typeName);
        if (!type) throw new Error(`Type not found: ${typeName} in ${currProtoName}`);

        return type;
    }

    private parseArrayType(typeName: string): [string, number | undefined] {
        const parts = typeName.slice(0, -1).split("[");
        return [
            parts.slice(0, -1).join("["),
            parts[parts.length - 1] ? parseInt(parts[parts.length - 1]) : undefined
        ];
    }

    private parseMapType(typeName: string): [string, string] {
        const parts = typeName.slice(0, -1).split("{");
        return [parts.slice(0, -1).join("{"), parts[parts.length - 1]];
    }

    private resolveType(currProtoName: string, typeName: string): [ProtocolConfig, TypeDefinition | undefined] {
        if (typeName.includes(Protocol.SEPARATOR)) {
            const parts = typeName.split(Protocol.SEPARATOR);
            const localType = parts.pop()!;
            const protoName = parts.join(Protocol.SEPARATOR);
            const proto = this.protocols.get(protoName);

            if (!proto) {
                throw new Error(`Unknown type: ${typeName} not found at protocol ${currProtoName}`);
            }

            return [proto, proto.types.get(localType)];
        }

        const proto = this.protocols.get(currProtoName);

        if (!proto) {
            throw new Error(`Unknown type: ${typeName} not found at protocol ${currProtoName}`);
        }

        return [proto, proto.types.get(typeName)];
    }
}
