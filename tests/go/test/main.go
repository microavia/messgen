package main

import messages "gotestmessgen/messgen/test_proto"

func main() {
	print("Hello, World!")
	s := messages.SimpleStruct{}
	s.F0 = 1
	s.F1 = 2
	s.F2 = 3
	s.F3 = 4
	s.F4 = 5
	s.F5 = 6
	s.F6 = 7
	s.F7 = 8
	s.F8 = 9
	s.serialize()
}
