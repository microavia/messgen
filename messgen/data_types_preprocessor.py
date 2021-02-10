from .utils import remove_array, get_module_name, get_array_size, is_dynamic, is_array
from .messgen_ex import MessgenException


class DataTypesPreprocessor:
    MAX_PROTO_ID = 0x80
    MSGS_NAMESPACE = "msgs"

    def __init__(self, plain_types_map, special_types_map):
        self._plain_types_map = plain_types_map
        self._special_types_map = special_types_map
        self._types_map = {}
        self._lookup_table = {}

        for k, v in plain_types_map.items():
            self._types_map[k] = {
                "align": v["align"],
                "static_size": v["size"],
                "plain": True
            }

        # TODO make aliases in correct way
        for k, v in special_types_map.items():
            self._types_map[k] = {
                "align": v["align"],
                "static_size": v["size"],
                "plain": True
            }

    def create_types_map(self, modules_map):
        """
        Data type post-processing.
        Creates additional fields for each module:
            "max_datatype_size" -   maximum size among all datatypes in module
            "namespace"         -   datatypes namespace inside a module

        Returns data types map of the following structure:
        {
            "typename": {
                "align": alignment,
                "static_size": size of static fields,
                "plain": indicates whether data type is plain one,
                "dynamic_fields_cnt": number of dynamic arrays in data type
                "fields": [{
                    "name": field name,
                    "type": normalized typename,
                    "dynamic": indicates whether this is a dynamic array,
                    "num": number of items. If > 1 -> fixed size array
                }, ...] - list of fields sorted by alignment
            }
        }

        Since currently each message is data type "typename" field is also
        added to each message.
        """
        self.__create_lookup_messages_set(modules_map)
        self.__load_constants(modules_map)

        max_datatype_size = 0

        for module_name, module in modules_map.items():
            module_ns = DataTypesPreprocessor.__create_namespace(module_name)
            module["namespace"] = module_ns

            for data_type in module["messages"]:
                typename = self.__normalize_typename(module_name, data_type["name"])

                if typename not in self._types_map:
                    self.__load_data_type(module_name, typename, data_type)

                data_type_size = self._types_map[typename]["static_size"]
                if data_type_size > max_datatype_size:
                    max_datatype_size = data_type_size

            module["max_datatype_size"] = max_datatype_size

        return self._types_map

    def __create_lookup_messages_set(self, modules_map):
        for module_name, module in modules_map.items():
            if module["proto_id"] >= self.MAX_PROTO_ID:
                raise MessgenException("Forbidden proto_id=%d for module %s" % (module["proto_id"], module_name))

            for message in module["messages"]:
                message_type = self.__normalize_typename(module_name, message["name"])
                self._lookup_table[message_type] = message

            for message in module["existing_types"]:
                message_type = self.__normalize_typename(message["namespace"], message["name"])
                self._lookup_table[message_type] = message

    def __load_constants(self, modules_map):
        for module_name, module in modules_map.items():
            for constant_type in module["constants"]:
                typename = self.__normalize_typename(module_name, constant_type["name"])

                if typename not in self._types_map:
                    self.__load_constant_type(typename, constant_type)
                else:
                    raise MessgenException("Constant typename '%s' duplication" % typename)

    def __load_constant_type(self, typename, constant):
        basetype = constant["basetype"]

        if basetype not in self._plain_types_map:
            raise MessgenException("Unknown basetype %s for constant %s" % (basetype, typename))

        basetype_info = self._types_map[constant["basetype"]]
        data_type_entry = {
            "deps": [],
            "typename": typename,
            "fields": [],
            "align": basetype_info["align"],
            "static_size": basetype_info["static_size"],
            "plain": True
        }

        self._types_map[typename] = data_type_entry

    def __load_data_type(self, module_name, typename, data_type):
        data_type["deps"] = []
        data_type["typename"] = typename
        data_type["dynamic_fields_cnt"] = 0

        if data_type.get("fields") is None:
            data_type["fields"] = []

        fields = data_type["fields"]

        alignment = 0
        static_size = 0
        full_size = 0

        for field in fields:
            child_norm_typename = self.__normalize_typename(module_name, field["type"])
            child_module_name = get_module_name(child_norm_typename)

            field["is_array"] = is_array(field["type"])
            field["num"] = int(get_array_size(field["type"]))

            if field["type"] == "string":
                field["is_dynamic"] = True
            else:
                field["is_dynamic"] = is_dynamic(field["type"])
            
            field["type"] = child_norm_typename

            if field["is_dynamic"]:
                data_type["dynamic_fields_cnt"] += 1

            if child_norm_typename not in self._types_map:
                if child_norm_typename not in self._lookup_table:
                    raise MessgenException("Data type '%s' not found for field '%s' in message '%s/%s'" %
                                           (child_norm_typename, field["name"], module_name, typename))

                child_datatype = self._lookup_table.get(child_norm_typename)
                self.__load_data_type(child_module_name, child_norm_typename, child_datatype)

            child_datatype_entry = self._types_map[child_norm_typename]

            children_number = 0
            if not child_datatype_entry["plain"]:
                if child_norm_typename not in data_type["deps"]:
                    data_type["deps"].append(child_norm_typename)

            if field["is_array"] and not field["is_dynamic"]:
                children_number = field["num"]
            elif field["is_dynamic"]:
                children_number = 0
                static_size += 2
            elif not field["is_array"]:
                children_number = 1

            static_size += child_datatype_entry["static_size"]*children_number
            child_alignment = child_datatype_entry["align"]

            assert((child_alignment == 1) or (child_alignment % 2 == 0))
            assert(child_alignment <= 8)

            if child_alignment > alignment:
                alignment = child_alignment

        if len(data_type["fields"]) != 0:
            data_type["fields"] = self.__sort_fields(data_type["fields"])
        else:
            alignment = 1

        data_type_entry = {
            "fields": data_type["fields"],
            "deps": data_type["deps"],
            "align": alignment,
            "static_size": static_size,
            "dynamic_fields_cnt": data_type["dynamic_fields_cnt"],
            "plain": False
        }

        self._types_map[typename] = data_type_entry

    @staticmethod
    def __insert_msgs_namespace(typename):
        # type_entries[0] - vendor name. type_entries[1:] - module path
        type_entries = typename.split("/")
        msgs_type = type_entries[0] + "/" + DataTypesPreprocessor.MSGS_NAMESPACE

        for entry in type_entries[1:]:
            msgs_type += "/" + entry

        return msgs_type

    @staticmethod
    def __create_namespace(module_name):
        return DataTypesPreprocessor.__insert_msgs_namespace(module_name)

    def __normalize_typename(self, module_name, typename):
        type_without_array = remove_array(typename)

        if (type_without_array in self._plain_types_map) or (type_without_array in self._special_types_map) or (self.MSGS_NAMESPACE in typename):
            return str(type_without_array)

        if "/" in type_without_array:
            return self.__insert_msgs_namespace(type_without_array)

        namespace = self.__create_namespace(module_name)
        return namespace + "/" + type_without_array

    def __sort_fields(self, fields):
        def sort_fields_by_alignment(fields):
            def _alignment_getter(field):
                # "type" field is already normalized
                return self._types_map[field["type"]]["align"]

            return list(
                sorted(
                    fields,
                    key=_alignment_getter,
                    reverse=True
                )
            )

        dynamic_fields = []
        composite_fields = []
        plain_fields = []

        for field in fields:
            if field["is_dynamic"]:
                dynamic_fields.append(field)
            elif self._types_map[field["type"]]["plain"]:
                plain_fields.append(field)
            else:
                composite_fields.append(field)

        return [
            *sort_fields_by_alignment(plain_fields),
            *sort_fields_by_alignment(composite_fields),
            *sort_fields_by_alignment(dynamic_fields)
        ]


