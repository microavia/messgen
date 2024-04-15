'use strict';

import {Struct} from "./Struct.ts";
import {HEADER_STRUCT} from "./HEADER_STRUCT.ts";
import {Schema, Messages} from "./messgen.js";


/**
 * Creates message struct namespace
 * @param {*} messagesJson - Array of messages schemas
 * @param {*} headerSchema - message header schema
 */
export function initializeMessages<KEYS extends string>(
  messagesJson: Record<KEYS, Schema>,
  headerSchema?: Schema
): Messages<KEYS> {

    let res = {
        __id__: [],
        __name__: [],
        HEADER_STRUCT: headerSchema ? new Struct(headerSchema) : HEADER_STRUCT
    };

    for (let m of getKeysWithSortById(messagesJson)) {

      let name = m.trim(),
        messageObj = messagesJson[m],
        msg = "MSG_" + name.toUpperCase(),
        id = messageObj.id;

      if (!res.__id__[id]) {
        let msg_struct = new Struct(messageObj, res);

        res.__id__[id] = msg_struct;
            res.__name__[id] = m.trim();
            res[msg] = msg_struct;
            res[name] = msg_struct;

        } else {
            console.warn(`Warning: message ${ id } ${ msg } already exists.`);
        }
    }

    return res;
}

const getKeysWithSortById = (obj) => {
    let keys = Object.keys(obj);
    keys.sort((a, b) => {
        return obj[a].id - obj[b].id;
    });
    return keys;
}
