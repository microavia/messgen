import { ProtocolManager } from "./protocol/ProtocolManager";
import { ProtocolJSON, ExtractPayload, GenericConfig, ProtocolId, MessageId } from "./types";
import { Buffer } from "./Buffer";

export class Codec<Config extends GenericConfig = GenericConfig> {
  private readonly protocolManager: ProtocolManager;

  constructor(schema: ProtocolJSON[]) {
    this.protocolManager = new ProtocolManager(schema);
  }

  public serialize<N extends keyof Config, T extends keyof Config[N]>(
    name: N,
    type: T,
    data: ExtractPayload<Config, N, T>
  ): Buffer {
    const converter = this.protocolManager.getConverter(name as string, type as string);
    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize<N extends keyof Config, T extends keyof Config[N]>(
    protocolId: ProtocolId,
    messageId: MessageId,
    arrayBuffer: ArrayBufferLike
  ): ExtractPayload<Config, N, T> {
    const protocol = this.protocolManager.getProtocolById(protocolId);
    const converter = this.protocolManager.getConverterById(protocol, messageId);

    return converter.deserialize(new Buffer(arrayBuffer)) as ExtractPayload<Config, N, T>;
  }
}
