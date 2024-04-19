export class Buffer {
  constructor(arrayBuffer: ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);
    this._offset = 0;
    this.size = arrayBuffer.byteLength;
  }
  
  buffer: ArrayBuffer;
  dataView: DataView;
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
  
  size: number
}
