import { ProtocolId, MessageId, ProtocolName } from "./types";
import { Protocol } from "./protocol/Protocol";
import { ProtocolJSON } from "./protocol/Protocol.types";
import { Converter } from "./converters/Converter";
import { ConverterFactory } from "./converters/ConverterFactory";
import { Buffer } from "./Buffer";
import { ExtractPayload, GenericConfig, TypeToIdMap, TypeToNameMap } from "./Codec.types";

export class Codec<Config extends GenericConfig = GenericConfig> {
  private typesByName: TypeToNameMap = new Map();
  private typesById: TypeToIdMap = new Map();
  private protocols: Protocol;

  constructor(schema: ProtocolJSON[]) {
    this.protocols = new Protocol(schema);
    const protocols = this.protocols.getProtocols();
    const converterFactory = new ConverterFactory(this.protocols);


    const items = Array.from(protocols.entries());
    for (const [protoName, proto] of items) {
      const typeMap = new Map<string, Converter>();
      const idMap = new Map<MessageId, Converter>();

      const types = Array.from(proto.types.entries());
      for (const [typeName] of types) {
        const converter = converterFactory.toConverter(protoName, typeName);
        typeMap.set(typeName, converter);

        const messageId = proto.messageIds.get(typeName);

        if (messageId !== undefined) {
          idMap.set(messageId, converter)
        }
      }

      this.typesByName.set(proto.name, typeMap);
      this.typesById.set(proto.id, idMap);
    }
  }


  public serialize<N extends keyof Config, T extends keyof Config[N]>(
    name: N,
    type: T,
    data: ExtractPayload<Config, N, T>
  ): Buffer {
    const types = this.typesByName.get(name as string);
    if (!types) {
      throw new Error(`Protocol not found: ${name as string}`);
    }

    const converter = types.get(type as string);
    if (!converter) {
      throw new Error(`Converter not found for type: ${type as string}`);
    }

    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize<N extends keyof Config, T extends keyof Config[N]>(
    protocolId: ProtocolId,
    messageId: MessageId,
    arrayBuffer: ArrayBufferLike
  ): ExtractPayload<Config, N, T> {
    const types = this.typesById.get(protocolId);
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId}`);
    }

    const converter = types.get(messageId);
    if (!converter) {
      throw new Error(`Converter not found for message ID: ${messageId}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer)) as ExtractPayload<Config, N, T>;
  }
}


