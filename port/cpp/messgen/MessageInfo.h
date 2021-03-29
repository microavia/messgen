#pragma once


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


}