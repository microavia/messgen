import {
    Protocol,
    ProtocolJSON,
    IType,
    TypeClass,
    Types,
    EnumTypeClass,
    IProtocolId,
    IProtocolName,
    IName,
} from "../types";
import { GlobalBasicConverters } from "../converters/BasicConverter";
import { Converter } from "../converters/Converter";
import { StructConverter } from "../converters/StructConverter";
import { NestedConverter } from "../converters/NestedConverter";
import { EnumConverter } from "../converters/EnumConverter";
import { topologicalSort } from "../utils/topologicalSort";



export class ProtocolManager {
    private readonly protocols: Map<IProtocolId, Protocol> = new Map();
    private readonly protocolNameToId: Map<IProtocolName, IProtocolId>;

    constructor(schema: ProtocolJSON[]) {
        schema.sort((a, b) => a.proto_id - b.proto_id);
        this.protocolNameToId = new Map(schema.map(({ proto_id, proto_name }) => [proto_name, proto_id]));

        for (const protocol of schema) {
            this.protocols.set(protocol.proto_id, this.initializeProtocol(protocol));
        }
    }

    public getProtocolByName(protocolName: IProtocolName): Protocol {
        const protocolId = this.protocolNameToId.get(protocolName);
        if (!protocolId) {
            throw new Error(`Protocol not found: ${protocolName}`);
        }
        return this.getProtocolById(protocolId);
    }

    public getProtocolById(protocolId: IProtocolId): Protocol {
        const protocol = this.protocols.get(protocolId);
        if (!protocol) {
            throw new Error(`Protocol not found with ID: ${protocolId}`);
        }
        return protocol;
    }

    public getConverter(protocolName: IProtocolName, type: IType): Converter {
        const protocol = this.getProtocolByName(protocolName);
        return this.getConverterFromProtocol(protocol, type);
    }

    public getConverterById(protocol: Protocol, messageId: number): Converter {
        const converter = protocol.typesMap.get(messageId);
        if (!converter) {
            throw new Error(`Converter not found for message ID: ${messageId}`);
        }
        return converter;
    }

    public getConverterFromProtocol(protocol: Protocol, type: IName): Converter {
        const converter = protocol.converters.get(type);
        if (!converter) {
            throw new Error(`Converter not found for type: ${type}`);
        }
        return converter;
    }

    private initializeProtocol(schema: ProtocolJSON): Protocol {
        const converters = new Map<IType, Converter>(GlobalBasicConverters);
        const typesNameToId = this.createTypesNameToIdMap(schema);

        const protocolData: Protocol = {
            protocol: schema,
            typesMap: new Map(),
            converters,
            typesNameToId
        };

        this.initializeConverters(schema, protocolData);
        this.mapTypeIdsToConverters(schema, protocolData);

        return protocolData;
    }

    private createTypesNameToIdMap(schema: ProtocolJSON): Record<string, number> {
        return Object.fromEntries(
            Object.entries<IType>(schema.types_map ?? {})
                .map(([id, type]) => [type.trim(), Number(id)])
        );
    }

    private initializeConverters(schema: ProtocolJSON, protocolData: Protocol): void {
        const sortedTypes = ProtocolManager.getSortedTypesByDependency(schema.types);

        for (const [typeName, typeInfo] of sortedTypes) {
            if (typeInfo.type_class === "struct") {
                this.initializeStructConverter(typeName, typeInfo, protocolData);
            } else if (typeInfo.type_class === "enum") {
                this.initializeEnumConverter(typeName, typeInfo, protocolData);
            }
        }
    }

    private initializeStructConverter(typeName: IType, typeInfo: TypeClass, protocolData: Protocol): void {
        typeInfo.fields?.forEach(field => {
            if (this.isCrossProtocolType(field.type)) {
                this.initializeCrossProtocolConverter(field.type, protocolData);
            }
            if (this.isNestedType(field.type)) {
                this.initializeNestedConverter(field.type, protocolData);
            }
        });

        protocolData.converters.set(
            typeName,
            new StructConverter(typeName, typeInfo, protocolData.converters)
        );
    }

    private initializeEnumConverter(typeName: IType, typeInfo: EnumTypeClass, protocolData: Protocol): void {
        protocolData.converters.set(
            typeName,
            new EnumConverter(typeName, typeInfo, protocolData.converters)
        );
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
        protocolData.converters.set(
            type,
            new NestedConverter(type, protocolData.converters)
        );
    }

    private parseCrossProtocolType(type: string): [IProtocolName, IName] {
        const match = /(.*\/)([^{\[]*)/.exec(type);
        if (!match) {
            throw new Error(`Invalid cross-protocol type: ${type}`);
        }
        return [match[1].slice(0, -1) as IProtocolName, match[2] as IName];
    }

    private mapTypeIdsToConverters(schema: ProtocolJSON, protocolData: Protocol): void {
        Object.entries<IType>(schema.types_map ?? {}).forEach(([id, type]) => {
            const converter = protocolData.converters.get(type.trim() as IType);
            if (!converter) {
                throw new Error(`Missing converter for type: ${type}`);
            }
            protocolData.typesMap.set(Number(id), converter);
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