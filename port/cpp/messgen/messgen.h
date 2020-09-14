#pragma once

#include "MemoryAllocator.h"
#include "Dynamic.h"
#include "Metadata.h"


namespace messgen {

using MessageID = uint8_t;

struct MessageInfo {
    static constexpr size_t HEADER_SIZE = 3;

    uint16_t size;              //!< Message payload size
    MessageID msg_id;           //!< Message type ID

    const uint8_t *payload;     //!< Pointer to message payload

    /**
     * Get total serialized message size, including header
     * @return total serialized size
     */
    size_t get_total_size() const {
        return HEADER_SIZE + size;
    }
};

template<typename T>
size_t serialize(const T &msg, uint8_t *buf, uint16_t buf_len) {
    size_t payload_size = msg.get_size();
    size_t ser_total_size = payload_size + MessageInfo::HEADER_SIZE;

    if (buf_len < ser_total_size) {
        return 0;
    }

    // info.seq and info.cls must be filled by caller
    buf[0] = T::TYPE;
    buf[1] = payload_size;
    buf[2] = payload_size >> 8;

    msg.serialize_msg(buf + MessageInfo::HEADER_SIZE);
    return ser_total_size;
}

inline int get_message_info(const uint8_t *buf, uint16_t buf_len, MessageInfo &info) {
    if (buf_len < MessageInfo::HEADER_SIZE) {
        return -1;
    }

    info.msg_id = buf[0];
    info.size = (uint16_t) (buf[2] << 8U) | buf[1];
    if (buf_len < info.size + MessageInfo::HEADER_SIZE) {
        return -1;
    }
    info.payload = buf + MessageInfo::HEADER_SIZE;

    return 0;
}

template<class T>
int parse(const MessageInfo &info, T &msg, MemoryAllocator &allocator) {
    if (info.msg_id != T::TYPE) {
        return -1;
    }

    if (msg.parse_msg(info.payload, info.size, allocator) == 0) {
        return -1;
    }

    return 0;
}

}
