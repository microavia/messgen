import { IType, IBasicType, IName, TypedArrayConstructor } from "../types";
import { Converter } from "../converters/Converter";

export type ParseArrayType = {
    variant: 'array';
    length?: number;
    elementType: IType;
};

export type ParseTypedArrayType = {
    variant: 'typed-array';
    length?: number;
    elementType: IType;
    TypedArray: TypedArrayConstructor;
};

export type ParseMapType = {
    variant: 'map';
    keyType: IType;
    valueType: IType;
    converter: Converter;
};

export type WrapperType = ParseArrayType | ParseTypedArrayType | ParseMapType;

export type ParseType = {
    converter: Converter;
    wrapper: WrapperType[];
};

/**
 * Parses a complex type string into a structured representation
 */
export function parseType(typeStr: IType, converters: Map<IType, Converter>): ParseType {
    const wrappers: WrapperType[] = [];
    let currentType = typeStr;
    let baseType: IType;

    const baseMatch = currentType.match(/^([^\[\{]+)/);
    if (!baseMatch) {
        throw new Error(`Invalid type string, no base type found: ${typeStr}`);
    }

    baseType = baseMatch[1];
    currentType = currentType.slice(baseMatch[1].length);

    const baseConverter = getConverterOrThrow(baseType, converters);

    while (currentType.length > 0) {
        if (currentType.startsWith('[')) {
            const arrayMatch = currentType.match(/^\[(\d*)\]/);
            if (!arrayMatch) {
                throw new Error(`Invalid array syntax in: ${typeStr}`);
            }

            const lengthStr = arrayMatch[1];
            const length = lengthStr ? parseInt(lengthStr) : undefined;

            if (wrappers.length === 0 && baseConverter.typedArray) {
                wrappers.push({
                    variant: 'typed-array',
                    length,
                    elementType: baseType,
                    TypedArray: baseConverter.typedArray
                });
            } else {
                wrappers.push({
                    variant: 'array',
                    length,
                    elementType: baseType
                });
            }

            currentType = currentType.slice(arrayMatch[0].length);
        }
        // Handle map notation {}
        else if (currentType.startsWith('{')) {
            const mapMatch = currentType.match(/^\{([^\}]+)\}/);
            if (!mapMatch) {
                throw new Error(`Invalid map syntax in: ${typeStr}`);
            }

            const keyType = mapMatch[1] as IBasicType;
            const keyConverter = getConverterOrThrow(keyType, converters);

            wrappers.push({
                variant: 'map',
                keyType,
                valueType: keyConverter.name,
                converter: keyConverter
            });

            currentType = currentType.slice(mapMatch[0].length);
        }
        else {
            throw new Error(`Invalid syntax in type string: ${typeStr}`);
        }
    }

    return {
        converter: baseConverter,
        wrapper: wrappers
    };
}

/**
 * Gets a converter from the map or throws a descriptive error
 */
function getConverterOrThrow(type: IType, converters: Map<IType, Converter>): Converter {
    const converter = converters.get(type);
    if (!converter) {
        throw new Error(
            `Unknown type: ${type}. If this is a complex type, ensure it's defined before use.`
        );
    }
    return converter;
}