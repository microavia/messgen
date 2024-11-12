import { GlobalBasicConverters } from "./converters/BasicConverter";
import { ProtocolManager } from "./protocol/ProtocolManager";
import { Converter } from "./converters/Converter";
import { Buffer } from "./Buffer";
import { commonHeaderConverter, IHeaderConverter } from "./HEADER_STRUCT";
import { ProtocolJSON, IType, IValue, GetProtocolPayload } from "./types";

export class Messgen<ProtocolMap extends Record<string, any>> {
  private readonly protocolManager: ProtocolManager;

  constructor(schema: ProtocolJSON[], private headerConverter: IHeaderConverter = commonHeaderConverter) {
    this.protocolManager = new ProtocolManager(schema);
  }

  public serializeMessage<Name extends keyof ProtocolMap, Type extends keyof ProtocolMap[Name]>(
    protocolName: Name,
    type: Type,
    data: GetProtocolPayload<ProtocolMap, Name, Type>,
    headerData: Record<string, any> = {}
  ): ArrayBuffer {
    const protocol = this.protocolManager.getProtocolByName(protocolName as string);
    const converter = this.protocolManager.getConverterFromProtocol(protocol, type as string);

    const messageSize = converter.size(data);
    const headerObject = {
      message_id: protocol.typesNameToId[type as string],
      protocol_id: protocol.protocol.proto_id,
      size: messageSize,
      ...headerData
    };

    const totalSize = messageSize + this.headerConverter.size(headerObject);
    const buffer = new Buffer(new ArrayBuffer(totalSize));

    this.headerConverter.serialize(headerObject, buffer);
    converter.serialize(data, buffer);

    return buffer.buffer;
  }

  public deserializeMessage(message: ArrayBufferLike): MessageResult[] {
    const buffer = new Buffer(message);
    const results: MessageResult[] = [];

    while (buffer.offset < buffer.size) {
      const header = this.headerConverter.deserialize(buffer);
      const protocol = this.protocolManager.getProtocolById(header.protocol_id);
      const converter = this.protocolManager.getConverterById(protocol, header.message_id);

      const data = converter.deserialize(buffer) as MessageResult;
      data.__HEADER__ = header;
      results.push(data);
    }

    return results;
  }

  public serialize<Name extends keyof ProtocolMap, Type extends keyof ProtocolMap[Name]>(
    protocolName: Name,
    type: Type,
    data: GetProtocolPayload<ProtocolMap, Name, Type>
  ): Buffer {
    const converter = this.protocolManager.getConverter(protocolName as string, type as string);
    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize<Name extends keyof ProtocolMap, Type extends keyof ProtocolMap[Name]>(
    protocolName: Name,
    type: Type,
    arrayBuffer: ArrayBufferLike
  ): GetProtocolPayload<ProtocolMap, Name, Type> {
    const converter = this.protocolManager.getConverter(protocolName as string, type as string);
    return converter.deserialize(new Buffer(arrayBuffer)) as GetProtocolPayload<ProtocolMap, Name, Type>;
  }

  static initializeBasicConverter() {
    return new Map<IType, Converter>(
      GlobalBasicConverters
    );
  }
}


interface MessageResult extends IValue {
  __HEADER__: Record<string, number>;
}
