#pragma once

#include "MemoryAllocator.h"
#include "Dynamic.h"
#include "Metadata.h"
#include "Serializer.h"
#include "Parser.h"

namespace messgen {

using MessageID = uint8_t;

struct MessageInfo {
    static constexpr size_t HEADER_SIZE = 5;

    uint32_t size;              //!< Message payload size
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

/**
 * @brief   Get serialized size (message size + header size)
 * @tparam T    -   message type
 * @param msg   -   message instance
 * @return  number of bytes in serialized message
 */
template <class T>
size_t get_serialized_size(const T & msg) {
    return msg.get_size() + MessageInfo::HEADER_SIZE;
}

/**
 * @brief Serialize message into given buffer
 * @tparam T        -   message type
 * @param msg       -   message instance
 * @param buf       -   buffer to serialize into
 * @param buf_len   -   buffer size
 * @return number of bytes written in case of success, -1 in case of error
 */
template<typename T>
int serialize(const T &msg, uint8_t *buf, size_t buf_len) {
    size_t payload_size = msg.get_size();
    size_t ser_total_size = payload_size + MessageInfo::HEADER_SIZE;

    if (buf_len < ser_total_size) {
        return -1;
    }

    // info.seq and info.cls must be filled by caller
    buf[0] = T::TYPE;
    buf[1] = payload_size & 0xFF;
    buf[2] = (payload_size >> 8U) & 0xFF;
    buf[3] = (payload_size >> 16U) & 0xFF;
    buf[4] = (payload_size >> 24U) & 0xFF;

    msg.serialize_msg(buf + MessageInfo::HEADER_SIZE);
    return ser_total_size;
}

/**
 * @brief Get message info from buffer
 * @param buf           -   buffer with serialized message inside
 * @param buf_len       -   buffer length
 * @param info          -   where to store message info
 * @return  0 in case of success, -1 in case of error
 */
inline int get_message_info(const uint8_t *buf, size_t buf_len, MessageInfo &info) {
    if (buf_len < MessageInfo::HEADER_SIZE) {
        return -1;
    }

    info.msg_id = buf[0];
    info.size = (buf[4] << 24U) |
                (buf[3] << 16U) |
                (buf[2] << 8U)  |
                (buf[1]);

    if (buf_len < info.size + MessageInfo::HEADER_SIZE) {
        return -1;
    }

    info.payload = buf + MessageInfo::HEADER_SIZE;
    return 0;
}

/**
 * @brief Parse message
 * @tparam T            -   message type
 * @param info          -   message info. See get_message_info.
 * @param msg           -   message instance to parse into
 * @param allocator     -   memory allocator instance
 * @return number of bytes parsed in case of success, -1 in case of error
 */
template<class T>
int parse(const MessageInfo &info, T &msg, MemoryAllocator &allocator) {
    if (info.msg_id != T::TYPE) {
        return -1;
    }

    return msg.parse_msg(info.payload, info.size, allocator);
}

/**
 * @brief   Iterate over all messages inside a buffer
 * @tparam F            -   Message handler type
 * @param data          -   buffer with messages
 * @param data_size     -   buffer size
 * @param f             -   message handler. Must override operator()(const MessageInfo &)
 * @return  Number of bytes parsed
 */
template <class F>
size_t for_each_message(const uint8_t *data, size_t data_size, F& f) {
    const uint8_t *buf = data;
    size_t remaining = data_size;

    messgen::MessageInfo msg_info{};
    while (0 == get_message_info(buf, remaining, msg_info)) {
        f(msg_info);

        const auto total_size = msg_info.get_total_size();
        buf += total_size;
        remaining -= total_size;
    }

    return buf - data;
}

}
