import { TypeClass } from "./types";

export const HEADER_STRUCT = {
  "type_class": "struct",
  fields: [
    { 'name': "seq", 'type': "uint32" },
    { 'name': "cls", 'type': "uint8" },
    { 'name': "msg_id", 'type': "uint8" },
    { 'name': "size", 'type': "uint32" }
  ]
} satisfies TypeClass;
