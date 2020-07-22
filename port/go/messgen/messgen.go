package messgen

import (
	"encoding/binary"
)

const (
	HeaderSize = 8
)

const (
	MessageClassData MessageClass = iota
	MessageClassRequest
	MessageClassResponse
)

type (
	MessageId       uint8
	MessageClass    uint8
	MessageSequence uint32

	Message interface {
		MsgId() int
		MsgSize() int
		Pack([]byte) (int, error)
		Unpack([]byte) error
	}

	MessageInfo struct {
		Id      MessageId
		Class   MessageClass
		Seq     MessageSequence
		Payload []byte
	}
)

func Serialize(info MessageInfo, msg Message) ([]byte, error) {
	buf := make([]byte, msg.MsgSize()+HeaderSize)
	binary.LittleEndian.PutUint32(buf[0:4], uint32(info.Seq))
	buf[4] = byte(info.Class)
	buf[5] = byte(msg.MsgId())
	binary.LittleEndian.PutUint16(buf[6:8], uint16(msg.MsgSize()))
	_, err := msg.Pack(buf[HeaderSize:])
	if err != nil {
		return buf, err
	}
	return buf, nil
}

// Parse header of the first message in buffer, return message info, total size (including header).
// Returns nil, 0 if buffer size or header is invalid.
func Parse(buf []byte) (*MessageInfo, int) {
	if len(buf) < HeaderSize {
		return nil, 0
	}
	var info MessageInfo
	info.Seq = MessageSequence(binary.LittleEndian.Uint32(buf[0:4]))
	info.Class = MessageClass(buf[4])
	info.Id = MessageId(buf[5])
	msgSize := int(binary.LittleEndian.Uint16(buf[6:8]))
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
