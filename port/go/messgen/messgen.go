package messgen

import (
	"encoding/binary"
	"errors"
)

const (
	HeaderSize = 5
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
	binary.LittleEndian.PutUint32(buf[1:5], uint32(msg.MsgSize()))
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
	binary.LittleEndian.PutUint32(buf[1:5], uint32(msg.MsgSize()))
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
	msgSize := int(binary.LittleEndian.Uint32(buf[1:5]))
	serMsgSize := HeaderSize + msgSize
	if len(buf) < serMsgSize {
		return nil, 0
	}

	info.Payload = buf[HeaderSize:serMsgSize]
	return &info, serMsgSize
}

func ReadString(b []byte) (string, error) {
	if len(b) < 4 {
		return "", errors.New("buffer too small")
	}
	n := int(binary.LittleEndian.Uint32(b))
	if len(b) < 4+n {
		return "", errors.New("buffer too small")
	}
	return string(b[4 : 4+n]), nil
}

func WriteString(b []byte, v string) error {
	if len(b) < 4+len(v) {
		return errors.New("buffer too small")
	}
	binary.LittleEndian.PutUint32(b, uint32(len(v)))
	copy(b[4:], []byte(v))
	return nil
}

func ReadBytes(b []byte) []byte {
	n := int(binary.LittleEndian.Uint32(b))
	return b[4 : 4+n]
}

func WriteBytes(b []byte, v []byte) {
	binary.LittleEndian.PutUint32(b, uint32(len(v)))
	copy(b[4:], v)
}
