const round = (number, precision) => {
  const pow = Math.pow(10, precision)
  return Math.round(number * pow) / pow
};

export function logBench(bench, isMs = false) {
  const min = bench.results.reduce((acc, cur) => Math.min(acc, cur?.mean ?? Infinity), Infinity) * 1000 * 1000

  console.table(
    bench.table().map((row) => {
      if (row) {
        // @ts-ignore
        row['diff from min %'] = -round((Number(row['Average Time (ns)']) / min - 1) * 100, 1)
        if (isMs) {
          // @ts-ignore
          row['Average Time (ms)'] = round(row['Average Time (ns)'] / 1000 / 1000)
          // @ts-ignore
          delete row['Average Time (ns)']
        }
      }
      return row
    })
  )
  console.log(bench.results)
}
