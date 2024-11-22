export function ASSERT_EXHAUSTIVE(x: never): asserts x is never {
  throw new Error(`ASSERT_EXHAUSTIVE when value: ${x}`)
}
