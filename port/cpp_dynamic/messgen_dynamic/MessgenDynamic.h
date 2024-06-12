#pragma once

#include <cassert>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <fstream>
#include <iostream>
#include <yaml-cpp/yaml.h>

using ProtocolId = int;
using TypeId = int;

class DynamicParser;

enum class TypeClass {
    NONE,
    SCALAR,
    ENUM,
    ARRAY,
};

ssize_t get_scalar_size(const std::string type_name) {
    if (type_name == "int8" or type_name == "uint8") {
        return 1;
    } else if (type_name == "int16" or type_name == "uint16") {
        return 2;
    } else if (type_name == "int32" or type_name == "uint32" or type_name == "float32") {
        return 4;
    } else if (type_name == "int64" or type_name == "uint64" or type_name == "float64") {
        return 8;
    } else if (type_name == "bool") {
        return 1;
    } else {
        throw std::runtime_error("Unknown scalar type: " + type_name);
    }
}

class FieldParser {
public:
    FieldParser(const std::string &name, ssize_t offset, const std::string &type_name) : _name(name), _offset(offset), _type_name(type_name), _valid(true) {}

    FieldParser(const std::string &name) : _name(name) {}

    virtual ~FieldParser() = default;

    virtual size_t parse(const uint8_t *data) = 0;

protected:
    std::string _name;
    ssize_t _offset = 0;                // -1 for dynamic offset
    FieldParser *_prev_field = nullptr; // previous field in the same message, for dynamic offset calculation
    std::string _type_name;
    bool _valid = false;
};

template <typename T> class ScalarFieldParser : public FieldParser {
public:
    ScalarFieldParser(const std::string &name, ssize_t offset, const std::string &type_name) : FieldParser(name, offset, type_name) {
        bool ok = false;
        if constexpr (std::is_same<T, int8_t>::value)
            ok = (type_name == "int8");
        else if constexpr (std::is_same<T, uint8_t>::value)
            ok = (type_name == "uint8");
        else if constexpr (std::is_same<T, int16_t>::value)
            ok = (type_name == "int16");
        else if constexpr (std::is_same<T, uint16_t>::value)
            ok = (type_name == "uint16");
        else if constexpr (std::is_same<T, int32_t>::value)
            ok = (type_name == "int32");
        else if constexpr (std::is_same<T, uint32_t>::value)
            ok = (type_name == "uint32");
        else if constexpr (std::is_same<T, int64_t>::value)
            ok = (type_name == "int64");
        else if constexpr (std::is_same<T, uint64_t>::value)
            ok = (type_name == "uint64");
        else if constexpr (std::is_same<T, float>::value)
            ok = (type_name == "float32");
        else if constexpr (std::is_same<T, double>::value)
            ok = (type_name == "float64");
        else if constexpr (std::is_same<T, bool>::value)
            ok = (type_name == "bool");

        if (not ok) {
            throw std::runtime_error("Type mismatch");
        }
    }

    ScalarFieldParser(const std::string &name) : FieldParser(name) {}

    size_t parse(const uint8_t *data) override {
        size_t offs = _offset;
        if (offs < 0) {
            // Parse previous field to calculate offset
            offs = _prev_field->parse(data);
        }
        _value = *reinterpret_cast<const T *>(data + offs);
        return offs + sizeof(T);
    }

private:
    T _value{};
};

class MessageParser {
public:
    MessageParser(const std::string &proto_dir, const std::string &name) : _name(name) {
        YAML::Node proto = YAML::LoadFile(proto_dir + "/_protocol.yaml");
        ProtocolId proto_id = proto["proto_id"].as<ProtocolId>();
        std::cout << "Protocol ID: " << proto_id << std::endl;
        YAML::Node types_map = proto["types_map"];
        for (auto it : types_map) {
            if (it.second.as<std::string>() == name) {
                _type_id = it.first.as<int>();
                std::cout << "Found message type: " << name << " (" << _type_id << ")" << std::endl;
                break;
            }
        }
        if (_type_id == -1) {
            throw std::runtime_error("Message type not found in _protocol.yaml: " + name);
        }

        _msg_def = YAML::LoadFile(proto_dir + "/" + name + ".yaml");
        assert(_msg_def["type_class"].as<std::string>() == "struct");
    }

    const std::string &name() const { return _name; }

    template <typename T> ScalarFieldParser<T> &add_scalar_field(const std::string &field_name) {
        ssize_t offs = 0;
        auto fields = _msg_def["fields"];
        for (YAML::const_iterator it = fields.begin(); it != fields.end(); ++it) {
            YAML::Node field = *it;
            const auto &it_field_name = field["name"].as<std::string>();
            const auto &it_type_name = field["type"].as<std::string>();
            if (it_field_name == field_name) {
                auto p = std::make_unique<ScalarFieldParser<T>>(field_name, offs, it_type_name);
                auto *res = p.get();
                _fields.push_back(std::move(p));
                std::cout << "Field: " << it_field_name << " (" << it_type_name << ") offs=" << offs << std::endl;
                return *res;
            }

            // Calculate offsset to our field
            offs += get_scalar_size(it_type_name);
        }
        auto p = std::make_unique<ScalarFieldParser<T>>(field_name);
        auto *res = p.get();
        _fields.push_back(std::move(p));
        std::cout << "Field: " << field_name << " not found" << std::endl;
        return *res;
    }

    void update(const uint8_t *data) {
        for (auto &field : _fields) {
            field->parse(data);
        }
        _updated = true;
    }

    bool is_updated() {
        if (_updated) {
            _updated = false;
            return true;
        }
        return false;
    }

private:
    std::string _name;
    int _type_id = -1;
    std::vector<std::unique_ptr<FieldParser>> _fields;
    bool _updated = false;
    YAML::Node _msg_def;
};

class DynamicParser {
public:
    DynamicParser(const std::string &proto_dir) : _proto_dir(proto_dir) {
        YAML::Node proto = YAML::LoadFile(_proto_dir + "/_protocol.yaml");
        ProtocolId proto_id = proto["proto_id"].as<ProtocolId>();
        std::cout << "Protocol ID: " << proto_id << std::endl;
        _types_map = proto["types_map"];
    }

    MessageParser &add_message(const std::string &name) {
        TypeId type_id = -1;
        for (YAML::const_iterator it = _types_map.begin(); it != _types_map.end(); ++it) {
            if (it->second.as<std::string>() == name) {
                type_id = it->first.as<int>();
                std::cout << "Found message type: " << name << " (" << type_id << ")" << std::endl;
                break;
            }
        }
        if (type_id == -1) {
            throw std::runtime_error("Message type not found: " + name);
        }

        return _messages.try_emplace(type_id, _proto_dir, name).first->second;
    }

    bool update(int msg_id, const uint8_t *data) {
        auto it = _messages.find(msg_id);
        if (it != _messages.end()) {
            it->second.update(data);
            return true;
        }
        return false;
    }

    const std::string base_dir() const { return _proto_dir; }

private:
    std::string _proto_dir;
    std::unordered_map<TypeId, MessageParser> _messages;
    YAML::Node _types_map;
};
