import {
  ProtocolJSON,
  IType,
  IProtocolName,
  IName,
  IValue,
} from "./types";
import { GlobalBasicConverters } from "./converters/BasicConverter";
import { Converter } from "./converters/Converter";
import { Buffer } from "./Buffer";
import { commonHeaderConverter, IHeaderConverter } from "./HEADER_STRUCT";
import { ProtocolManager } from "./protocol/ProtocolManager";


interface MessageResult extends IValue {
  __HEADER__: Record<string, number>;
}

export class Messgen {
  private readonly protocolManager: ProtocolManager;

  constructor(schema: ProtocolJSON[], private headerConverter: IHeaderConverter = commonHeaderConverter) {
    this.protocolManager = new ProtocolManager(schema);

  }

  public serializeMessage(
    protocolName: IProtocolName,
    type: IName,
    data: IValue,
    headerData: Record<string, any> = {}
  ): ArrayBuffer {
    const protocol = this.protocolManager.getProtocolByName(protocolName);
    const converter = this.protocolManager.getConverterFromProtocol(protocol, type);

    const messageSize = converter.size(data);
    const headerObject = {
      message_id: protocol.typesNameToId[type],
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

  public serialize(protocolName: IProtocolName, type: IName, data: Record<string, any>): Buffer {
    const converter = this.protocolManager.getConverter(protocolName, type);
    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize(protocolName: IProtocolName, type: IName, arrayBuffer: ArrayBufferLike): unknown {
    const converter = this.protocolManager.getConverter(protocolName, type);
    return converter.deserialize(new Buffer(arrayBuffer));
  }

  static initializeBasicConverter() {
    return new Map<IType, Converter>(
      GlobalBasicConverters
    )
  }
}