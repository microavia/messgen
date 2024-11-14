export class Buffer {
  size: number
  buffer: ArrayBuffer;
  dataView: DataView;

  constructor(arrayBuffer: ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);
    this._offset = 0;
    this.size = arrayBuffer.byteLength;
  }

  private _offset: number;


  get offset(): number {
    return this._offset;
  }

  set offset(value: number) {
    if (value < 0 || value > this.size) {
      throw new Error('Buffer offset is out of bounds');
    }
    this._offset = value;
  }
}
