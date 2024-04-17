import { Struct } from "./Struct.js";
import { SchemaObj } from "./types";

export const HEADER_STRUCT = new Struct({
  id: 0,
  fields: [
    { 'name': "seq", 'type': "uint32" },
    { 'name': "cls", 'type': "uint8" },
    { 'name': "msg_id", 'type': "uint8" },
    { 'name': "size", 'type': "uint32" }
  ]
} satisfies SchemaObj);
