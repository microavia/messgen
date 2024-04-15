import {Struct} from "./Struct.js";
import { SchemaObj } from "./types";

export const HEADER_STRUCT = new Struct({
  id: 0,
  fields: [
    { 'name': "seq", 'type': "Uint32" },
    { 'name': "cls", 'type': "Uint8" },
    { 'name': "msg_id", 'type': "Uint8" },
    { 'name': "size", 'type': "Uint32" }
  ]
} satisfies SchemaObj);
