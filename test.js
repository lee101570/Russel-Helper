function power(base, exponent) {
  if (exponent === 0) {
    return 1
  }
  return base * power(base, exponent - 1)
}

console.log(power(12, 2))

// graphmaking function for mathmatical functions
function graph(fn, xMin, xMax, yMin, yMax) {
    let graph = ''
    for (let y = yMax; y >= yMin; y--) {
        for (let x = xMin; x <= xMax; x++) {
        if (fn(x, y)) {
            graph += 'X'
        } else {
            graph += ' '
        }
        }
        graph += '\n'
    }
    return graph
    }

console.log(graph((x, y) => x * x + y * y <= 100, -10, 10, -10, 10))
