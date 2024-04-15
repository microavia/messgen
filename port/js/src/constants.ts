import { decodeUTF8 } from "./utf8";

const IS_LITTLE_ENDIAN = true;
const DYNAMIC_SIZE_TYPE = "Uint32";
/**
 *
 * Read function returns value from byte array.
 * Write function returns type byte size.
 */
export const basicTypes = [
  {
    name: "Char",
    size: 1,
    read: (v, s) => String.fromCharCode(v.getInt8(s)),
    write: (v, s, a) => {
      v.setInt8(s, a ? a.toString().charCodeAt(0) : 0);
      return 1;
    }
  }, {
    name: "Int8",
    size: 1,
    read: (v, s) => v.getInt8(s),
    write: (v, s, a) => {
      v.setInt8(s, a);
      return 1;
    }
  }, {
    name: "Uint8",
    size: 1,
    read: (v, s) => v.getUint8(s),
    write: (v, s, a) => {
      v.setUint8(s, a);
      return 1;
    }
  }, {
    name: "Int16",
    size: 2,
    read: (v, s) => v.getInt16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "Uint16",
    size: 2,
    read: (v, s) => v.getUint16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "Int32",
    size: 4,
    read: (v, s) => v.getInt32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "Uint32",
    size: 4,
    read: (v, s) => v.getUint32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "Int64",
    size: 8,
    read: (v, s) => v.getBigInt64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setBigInt64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "Uint64",
    size: 8,
    read: (v, s) => v.getBigUint64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setBigUint64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "Float",
    size: 4,
    read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "Float32",
    size: 4,
    read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "Double",
    size: 8,
    read: (v, s) => v.getFloat64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "String",
    size: 4,
    read: (v, s) => decodeUTF8(new Uint8Array(v.buffer, s + 4, v.getUint32(s, IS_LITTLE_ENDIAN))),
    write: (v, s, a) => {
      let size = a.length;
      v.setUint32(s, size, true);
      for (let i = 0, s2 = s + 4; i < size; i++) {
        v.setUint8(s2 + i, a[i]);
      }
      return size + 4;
    }
  }
] satisfies {
  name: string;
  size: number;
  read: (v: DataView, s: number) => any;
  write: (v: DataView, s: number, a: any) => number;
}[]


export let typeIndex: Record<string, number> = {}
export let typeSize: number[] = []

export let readFunc = []
export let writeFunc = [];

for (let i = 0; i < basicTypes.length; i++) {
  let ti = basicTypes[i];
  typeIndex[ti.name] = i;
  typeSize[i] = ti.size;
  readFunc[i] = ti.read;
  writeFunc[i] = ti.write;
}

const DYN_TYPE = typeIndex[DYNAMIC_SIZE_TYPE];
export const DYN_TYPE_SIZE = typeSize[DYN_TYPE];
export const DYN_READ = readFunc[DYN_TYPE];
export const DYN_WRITE = writeFunc[DYN_TYPE];
