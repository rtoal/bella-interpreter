const P = (p) => {
  let [m, o] = [{}, []]
  for (let s of p.body) {
    ;[m, o] = S(s)([m, o])
  }
  return o
}

const S = (s) => ([m, o]) => {
  if (s.constructor === VariableDeclaration) {
    let { variable: v, initializer: e } = s
    return [{ ...m, [v]: E(e)(m) }, o]
  } else if (s.constructor === PrintStatement) {
    let { argument: e } = s
    return [m, [...o, E(e)(m)]]
  } else if (s.constructor === Assignment) {
    const { target: v, source: e } = s
    return [{ ...m, [v]: E(e)(m) }, o]
  } else if (s.constructor === WhileStatement) {
    const { test, body } = s
    if (C(test)(m)) {
      body.forEach((stmt) => {
        ;[m, o] = S(stmt)([m, o])
      })
      return S(s)([m, o])
    }
    return [m, o]
  } else if (s.constructor === FunctionDeclaration) {
    const { name, parameters, body } = s
    return [{ ...m, [name]: { parameters, body } }, o]
  }
}

const E = (e) => (m) => {
  if (typeof e === "number") {
    return e
  } else if (typeof e == "string") {
    const id = e
    return m[id]
  } else if (e.constructor === Unary) {
    // The only unary operator for e is negation
    return -E(e)(m)
  } else if (e.constructor === Binary) {
    const { op, left: e1, right: e2 } = e
    switch (op) {
      case "+":
        return E(e1)(m) + E(e2)(m)
      case "-":
        return E(e1)(m) - E(e2)(m)
      case "*":
        return E(e1)(m) * E(e2)(m)
      case "/":
        return E(e1)(m) / E(e2)(m)
      case "%":
        return E(e1)(m) % E(e2)(m)
      case "**":
        return E(e1)(m) ** E(e2)(m)
    }
  } else if (e.constructor === Call) {
    const { id, args } = e
    let [params, body] = m[id]
    for (let i = 0; i < args.length; i++) {
      m[params[i]] = args[i]
    }
    return E(body)(m)
  } else if (e.constructor === Conditional) {
    const { test, consequent, alternate } = e
    return C(test)(m) ? E(consequent)(m) : E(alternate)(m)
  }
}

const C = (c) => (m) => {
  if (c === true) {
    return true
  } else if (c === false) {
    return false
  } else if (c.constructor === Binary) {
    const { op, left, right } = c
    switch (op) {
      case "==":
        return E(left)(m) === E(right)(m)
      case "!=":
        return E(left)(m) !== E(right)(m)
      case "<":
        return E(left)(m) < E(right)(m)
      case "<=":
        return E(left)(m) <= E(right)(m)
      case ">":
        return E(left)(m) >= E(right)(m)
      case ">=":
        return E(left)(m) >= E(right)(m)
      case "&&":
        return C(left)(m) && C(right)(m)
      case "||":
        return C(left)(m) || C(right)(m)
    }
  } else if (c.constructor === Unary) {
    const { operand } = c
    // The only unary operator for conditional is the NOT
    return !C(operand)(m)
  }
}

class Program {
  constructor(body) {
    this.body = body
  }
}

class VariableDeclaration {
  constructor(variable, initializer) {
    Object.assign(this, { variable, initializer })
  }
}

class FunctionDeclaration {
  constructor(name, parameters, body) {
    Object.assign(this, { name, parameters, body })
  }
}

class PrintStatement {
  constructor(argument) {
    this.argument = argument
  }
}

class WhileStatement {
  constructor(test, body) {
    Object.assign(this, { test, body })
  }
}

class Assignment {
  constructor(target, source) {
    Object.assign(this, { target, source })
  }
}

class Binary {
  constructor(op, left, right) {
    Object.assign(this, { op, left, right })
  }
}

class Unary {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

class Conditional {
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
  }
}

class Call {
  constructor(id, args) {
    Object.assign(this, { id, args })
  }
}

const program = (s) => new Program(s)
const vardec = (i, e) => new VariableDeclaration(i, e)
const print = (e) => new PrintStatement(e)
const whileLoop = (c, b) => new WhileStatement(c, b)
const assign = (i, e) => new Assignment(i, e)
const plus = (x, y) => new Binary("+", x, y)
const minus = (x, y) => new Binary("-", x, y)
const times = (x, y) => new Binary("*", x, y)
const remainder = (x, y) => new Binary("%", x, y)
const power = (x, y) => new Binary("**", x, y)
const eq = (x, y) => new Binary("==", x, y)
const noteq = (x, y) => new Binary("!=", x, y)
const less = (x, y) => new Binary("<", x, y)
const lesseq = (x, y) => new Binary("<=", x, y)
const greater = (x, y) => new Binary(">", x, y)
const greatereq = (x, y) => new Binary(">=", x, y)
const and = (x, y) => new Binary("&&", x, y)
const or = (x, y) => new Binary("||", x, y)

console.log(P(program([vardec("x", 2), print("x")])))

console.log(
  P(
    program([
      vardec("x", 3),
      whileLoop(less("x", 10), [print("x"), assign("x", plus("x", 2))]),
    ])
  )
)

console.log(
  P(program([vardec("x", 3), vardec("y", plus("x", 10)), print("x"), print("y")]))
)
