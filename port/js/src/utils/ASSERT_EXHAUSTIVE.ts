export function ASSERT_EXHAUSTIVE(x: never): asserts x is never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`ASSERT_EXHAUSTIVE when value: ${x}`)
}
