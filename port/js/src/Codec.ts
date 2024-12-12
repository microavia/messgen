import { type RawType, type Protocol, Protocols } from './protocol';
import { type Converter, ConverterFactory } from './converters';
import type { ExtractPayload, GenericConfig, TypeToIdMap, TypeToNameMap } from './Codec.types';
import { Buffer } from './Buffer';
import type { ProtocolId, MessageId } from './types';

export class Codec<Config extends GenericConfig = GenericConfig> {
  private typesByName: TypeToNameMap = new Map();
  private typesById: TypeToIdMap = new Map();
  private protocols = new Protocols();

  constructor(rawTypes: RawType[] = [], protocols: Protocol[] = []) {
    this.protocols.load(rawTypes);
    const converterFactory = new ConverterFactory(this.protocols);

    for (const protocol of protocols) {
      const { name, proto_id: protoId, types } = protocol;
      const typeMap = new Map<string, Converter>();
      const idMap = new Map<MessageId, Converter>();

      for (const [messageId, typeName] of Object.entries(types)) {
        const converter = converterFactory.toConverter(typeName);
        typeMap.set(typeName, converter);
        idMap.set(parseInt(messageId, 10), converter);
      }
      this.typesByName.set(name, typeMap);
      this.typesById.set(protoId, idMap);
    }
  }

  public serialize<N extends keyof Config, T extends keyof Config[N]>(
    name: N,
    type: T,
    data: ExtractPayload<Config, N, T>,
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
    arrayBuffer: ArrayBufferLike,
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
