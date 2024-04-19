import { decodeUTF8 } from "./utils/utf8";
import { BasicTypesConfig, IPrimitiveType } from "./types";

export const IS_LITTLE_ENDIAN = false; // todo check
export const DYNAMIC_SIZE_TYPE: IPrimitiveType = "uint32";
/**
 *
 * Read function returns value from byte array.
 * Write function returns type byte size.
 */
export const basicTypes = [
  {
    name: "int8",
    size: () => 1,
    read: (v, s) => v.getInt8(s),
    write: (v, s, a) => {
      v.setInt8(s, a);
      return 1;
    }
  }, {
    name: "uint8",
    size: () => 1,
    read: (v, s) => v.getUint8(s),
    write: (v, s, a) => {
      v.setUint8(s, a);
      return 1;
    }
  }, {
    name: "int16",
    size: () => 2,
    read: (v, s) => v.getInt16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "uint16",
    size: () => 2,
    read: (v, s) => v.getUint16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "int32",
    size: () => 4,
    read: (v, s) => v.getInt32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "uint32",
    size: () => 4,
    read: (v, s) => v.getUint32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "int64",
    size: () => 8,
    read: (v, s) => v.getBigInt64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setBigInt64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "uint64",
    size: () => 8,
    read: (v, s) => v.getBigUint64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setBigUint64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    //   name: "float",
    //   size: () => 4,
    //   read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    //   write: (v, s, a) => {
    //     v.setFloat32(s, a, IS_LITTLE_ENDIAN);
    //     return 4;
    //   }
    // }, {
    name: "float32",
    size: () => 4,
    read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "float64",
    size: () => 8,
    read: (v, s) => v.getFloat64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "char",
    size: () => 1,
    read: (v, s) => String.fromCharCode(v.getInt8(s)),
    write: (v, s, a) => {
      v.setInt8(s, a ? a.toString().charCodeAt(0) : 0);
      return 1;
    }
  }, {
    name: "bool",
    size: () => 1,
    read: (v, s) => Boolean(v.getInt8(s)),
    write: (v, s, a) => {
      v.setInt8(s, a ? 1 : 0);
      return 1;
    }
  }, {
    name: "string",
    size: (value: string) => value.length + 4,
    read: (v, s) => {
      return decodeUTF8(new Uint8Array(v.buffer, s + 4, v.getUint32(s, IS_LITTLE_ENDIAN)));
    },
    write: (v, s, a: string) => {
      let size = a.length;
      v.setUint32(s, size, true);
      for (let i = 0, s2 = s + 4; i < size; i++) {
        v.setUint8(s2 + i, (a[i] as unknown as number));
      }
      return size + 4;
    }
  }
] satisfies BasicTypesConfig[]


export let typeIndex: Record<string, number> = {}
export let typeSize: number[] = []

export let readFunc: ((v: DataView, s: number) => any)[] = []
export let writeFunc: ((v: DataView, s: number, a: any) => number)[] = [];

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
