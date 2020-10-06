#pragma once

#include <type_traits>


namespace messgen {

/**
 * @brief Structure for enabling bitmasks operations on enums
 * @tparam Enum     -   enum type
 */
template<typename Enum>
struct EnableBitMaskOperators
{
    static const bool enable = false;
};

}

/**
 * @brief Macros for enabling bitmask operations on Enum.
 *          Must be used in messgen namespace
 */
#define ENABLE_BITMASK_OPERATORS(ENUM)                      \
            template<>                                      \
            struct EnableBitMaskOperators<ENUM> {           \
                static const bool enable = true;            \
            }


/**
 *  Below are bit operations overloaded for enums
 */

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type
operator |(Enum lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    return static_cast<Enum> (
            static_cast<underlying>(lhs) |
            static_cast<underlying>(rhs)
    );
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type
operator &(Enum lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    return static_cast<Enum> (
            static_cast<underlying>(lhs) &
            static_cast<underlying>(rhs)
    );
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type
operator ^(Enum lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    return static_cast<Enum> (
            static_cast<underlying>(lhs) ^
            static_cast<underlying>(rhs)
    );
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type &
operator |=(Enum &lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    lhs = static_cast<Enum> (
            static_cast<underlying>(lhs) |
            static_cast<underlying>(rhs)
    );

    return lhs;
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type &
operator &=(Enum &lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    lhs = static_cast<Enum> (
            static_cast<underlying>(lhs) &
            static_cast<underlying>(rhs)
    );

    return lhs;
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type &
operator ^=(Enum &lhs, Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    lhs = static_cast<Enum> (
            static_cast<underlying>(lhs) ^
            static_cast<underlying>(rhs)
    );

    return lhs;
}

template<typename Enum>
typename std::enable_if<messgen::EnableBitMaskOperators<Enum>::enable, Enum>::type
operator ~(Enum rhs)
{
    using underlying = typename std::underlying_type<Enum>::type;
    return static_cast<Enum> (
            ~static_cast<underlying>(rhs)
    );
}