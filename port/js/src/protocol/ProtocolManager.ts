import {
    Protocol,
    ProtocolJSON,
    IType,
    TypeClass,
    Types,
    EnumTypeClass,
    ProtocolId,
    ProtocolName,
    IName,
    MessageId,
} from "../types";
import { GlobalBasicConverters } from "../converters/BasicConverter";
import { Converter } from "../converters/Converter";
import { StructConverter } from "../converters/StructConverter";
import { NestedConverter } from "../converters/NestedConverterV1";
import { EnumConverter } from "../converters/EnumConverter";
import { topologicalSort } from "../utils/topologicalSort";



export class ProtocolManager {
    private readonly protocols: Map<ProtocolId, Protocol> = new Map();
    private readonly protocolNameToId: Map<ProtocolName, ProtocolId>;

    constructor(schema: ProtocolJSON[]) {
        schema.sort((a, b) => a.proto_id - b.proto_id);
        this.protocolNameToId = new Map(schema.map(({ proto_id, proto_name }) => [proto_name, proto_id]));

        for (const protocol of schema) {
            this.protocols.set(protocol.proto_id, this.initializeProtocol(protocol));
        }
    }

    public getProtocolByName(protocolName: ProtocolName): Protocol {
        const protocolId = this.protocolNameToId.get(protocolName);
        if (protocolId === undefined) {
            throw new Error(`Protocol not found: ${protocolName}`);
        }
        return this.getProtocolById(protocolId);
    }

    public getProtocolById(protocolId: ProtocolId): Protocol {
        const protocol = this.protocols.get(protocolId);
        if (protocol === undefined) {
            throw new Error(`Protocol not found with ID: ${protocolId}`);
        }
        return protocol;
    }

    public getConverter(protocolName: ProtocolName, type: IType): Converter {
        const protocol = this.getProtocolByName(protocolName);
        return this.getConverterFromProtocol(protocol, type);
    }

    public getConverterById(protocol: Protocol, messageId: MessageId): Converter {
        const converter = protocol.typesMap.get(messageId);
        if (!converter) {
            throw new Error(`Converter not found for message ID: ${messageId}`);
        }
        return converter;
    }

    private getConverterFromProtocol(protocol: Protocol, type: IName): Converter {
        const converter = protocol.converters.get(type);
        if (!converter) {
            throw new Error(`Converter not found for type: ${type}`);
        }
        return converter;
    }

    private initializeProtocol(schema: ProtocolJSON): Protocol {
        const converters = new Map<IType, Converter>(GlobalBasicConverters);
        const typesNameToId = this.createTypesNameToIdMap(schema);

        const protocol: Protocol = {
            protocol: schema,
            typesMap: new Map(),
            converters,
            typesNameToId
        };

        this.initializeConverters(schema, protocol);
        this.mapTypeIdsToConverters(schema, protocol);

        return protocol;
    }

    private createTypesNameToIdMap(schema: ProtocolJSON): Record<string, number> {
        const { types_map = {} } = schema;
        return Object.fromEntries(Object.entries<IType>(types_map)
            .map(([id, type]) => [type.trim(), Number(id)]));
    }

    private initializeConverters(schema: ProtocolJSON, protocol: Protocol): void {
        const sortedTypes = ProtocolManager.getSortedTypesByDependency(schema.types);

        for (const [typeName, typeInfo] of sortedTypes) {
            if (typeInfo.type_class === "struct") {
                this.initializeStructConverter(typeName, typeInfo, protocol);
            } else if (typeInfo.type_class === "enum") {
                this.initializeEnumConverter(typeName, typeInfo, protocol);
            }
        }
    }

    private initializeStructConverter(typeName: IType, typeInfo: TypeClass, protocol: Protocol): void {
        const fields = typeInfo.fields ?? [];

        for (const field of fields) {
            if (this.isCrossProtocolType(field.type)) {
                this.initializeCrossProtocolConverter(field.type, protocol);
            }
            if (this.isNestedType(field.type)) {
                this.initializeNestedConverter(field.type, protocol);
            }
        }

        protocol.converters.set(typeName, new StructConverter(typeName, typeInfo, protocol.converters));
    }

    private initializeEnumConverter(typeName: IType, typeInfo: EnumTypeClass, protocolData: Protocol): void {
        protocolData.converters.set(typeName, new EnumConverter(typeName, typeInfo, protocolData.converters));
    }

    private isCrossProtocolType(type: string): boolean {
        return type.includes("/");
    }

    private isNestedType(type: string): boolean {
        return type.includes("[") || type.includes("{");
    }

    private initializeCrossProtocolConverter(type: string, protocolData: Protocol): void {
        const [protocolName, typeName] = this.parseCrossProtocolType(type);
        const converter = this.getConverter(protocolName, typeName);
        protocolData.converters.set(type, converter);
    }

    private initializeNestedConverter(type: string, protocolData: Protocol): void {
        protocolData.converters.set(type, new NestedConverter(type, protocolData.converters));
    }

    private parseCrossProtocolType(type: string): [ProtocolName, IName] {
        const match = /(.*\/)([^{\[]*)/.exec(type);
        if (!match) {
            throw new Error(`Invalid cross-protocol type: ${type}`);
        }
        return [match[1].slice(0, -1) as ProtocolName, match[2] as IName];
    }

    private mapTypeIdsToConverters(schema: ProtocolJSON, protocol: Protocol): void {
        Object.entries<IType>(schema.types_map ?? {}).forEach(([id, type]) => {
            const converter = protocol.converters.get(type.trim() as IType);
            if (!converter) {
                throw new Error(`Missing converter for type: ${type}`);
            }
            protocol.typesMap.set(Number(id), converter);
        });
    }

    static getSortedTypesByDependency(types: Types): [IType, TypeClass | EnumTypeClass][] {
        const dependencyGraph = Object.entries(types).reduce((graph, [typeName, typeInfo]) => {
            graph[typeName] = [];

            if (typeInfo.type_class === "struct") {
                typeInfo.fields?.forEach(field => {
                    const dependencyName = field.type.replace(/(\[|\{).+/g, "");
                    if (types[dependencyName]) {
                        graph[typeName].push(dependencyName);
                    }
                });
            }

            return graph;
        }, {} as Record<string, string[]>);

        const sortedTypeNames = topologicalSort(dependencyGraph);
        return sortedTypeNames.map(name => [name, types[name]] as [IType, TypeClass | EnumTypeClass]);
    }
}
