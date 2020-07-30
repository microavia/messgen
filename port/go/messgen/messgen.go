package messgen

import (
	"encoding/binary"
	"errors"
)

const (
	HeaderSize = 3
)

type (
	MessageId uint8

	Message interface {
		MsgId() int
		MsgSize() int
		Pack([]byte) (int, error)
		Unpack([]byte) error
	}

	MessageInfo struct {
		Id      MessageId
		Payload []byte
	}
)

func Serialize(msg Message) ([]byte, error) {
	buf := make([]byte, msg.MsgSize()+HeaderSize)
	buf[0] = byte(msg.MsgId())
	binary.LittleEndian.PutUint16(buf[1:3], uint16(msg.MsgSize()))
	_, err := msg.Pack(buf[HeaderSize:])
	if err != nil {
		return buf, err
	}
	return buf, nil
}

func SerializeToBuffer(msg Message, buf []byte) (int, error) {
	totalSize := HeaderSize + msg.MsgSize()
	if len(buf) < totalSize {
		return 0, errors.New("wrong buffer size")
	}

	buf[0] = byte(msg.MsgId())
	binary.LittleEndian.PutUint16(buf[1:3], uint16(msg.MsgSize()))
	_, err := msg.Pack(buf[HeaderSize:])
	if err != nil {
		return 0, err
	}
	return totalSize, nil
}

// Parse header of the first message in buffer, return message info, total size (including header).
// Returns nil, 0 if buffer size or header is invalid.
func Parse(buf []byte) (*MessageInfo, int) {
	if len(buf) < HeaderSize {
		return nil, 0
	}
	var info MessageInfo
	info.Id = MessageId(buf[0])
	msgSize := int(binary.LittleEndian.Uint16(buf[1:3]))
	serMsgSize := HeaderSize + msgSize
	if len(buf) < serMsgSize {
		return nil, 0
	}

	info.Payload = buf[HeaderSize:serMsgSize]
	return &info, serMsgSize
}

func ReadString(b []byte) string {
	n := int(binary.LittleEndian.Uint16(b))
	return string(b[2 : 2+n])
}

func WriteString(b []byte, v string) {
	binary.LittleEndian.PutUint16(b, uint16(len(v)))
	copy(b[2:], []byte(v))
}

func ReadBytes(b []byte) []byte {
	n := int(binary.LittleEndian.Uint16(b))
	return b[2 : 2+n]
}

func WriteBytes(b []byte, v []byte) {
	binary.LittleEndian.PutUint16(b, uint16(len(v)))
	copy(b[2:], v)
}
