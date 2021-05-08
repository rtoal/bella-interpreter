// Interpreter functions

const P = (p) => {
  let [m, o] = [{}, []]
  for (let s of p.body) {
    ;[m, o] = S(s)([m, o])
  }
  return o
}

const S = (s) => ([m, o]) => {
  switch (s.constructor) {
    case VariableDeclaration: {
      const { variable: v, initializer: e } = s
      return [{ ...m, [v]: E(e)(m) }, o]
    }
    case PrintStatement: {
      const { argument: e } = s
      return [m, [...o, E(e)(m)]]
    }
    case Assignment: {
      const { target: v, source: e } = s
      return [{ ...m, [v]: E(e)(m) }, o]
    }
    case WhileStatement: {
      const { test, body } = s
      if (C(test)(m) === false) {
        return [m, o]
      }
      for (let s1 of body) {
        ;[m, o] = S(s1)([m, o])
      }
      return S(s)([m, o])
    }
    case FunctionDeclaration: {
      const { name: f, parameters: p, body: b } = s
      return [{ ...m, [f]: [p, b] }, o]
    }
  }
}

const E = (e) => (m) => {
  switch (e.constructor) {
    case Number: {
      return e
    }
    case String: {
      const id = e
      return m[id]
    }
    case Unary: {
      // The only unary operator for e is negation
      const { operand: e1 } = e
      return -E(e1)(m)
    }
    case Binary: {
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
    }
    case Conditional: {
      const { test: c, consequent: e1, alternate: e2 } = e
      return C(c)(m) ? E(e1)(m) : E(e2)(m)
    }
    case Call: {
      const { id, args } = e
      let [params, body] = m[id]
      let localMemory = { ...m }
      for (let i = 0; i < args.length; i++) {
        localMemory[params[i]] = args[i]
      }
      return E(body)(localMemory)
    }
  }
}

const C = (c) => (m) => {
  switch (c.constructor) {
    case Boolean: {
      return c
    }
    case Unary: {
      const { operand: c1 } = c
      // The only unary operator for conditional is the NOT
      return !C(c1)(m)
    }
    case Binary: {
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
    }
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

// Utility functions to make trees very elegantly

const program = (s) => new Program(s)
const vardec = (i, e) => new VariableDeclaration(i, e)
const fundec = (f, p, b) => new FunctionDeclaration(f, p, b)
const print = (e) => new PrintStatement(e)
const whileLoop = (c, b) => new WhileStatement(c, b)
const assign = (i, e) => new Assignment(i, e)
const plus = (x, y) => new Binary("+", x, y)
const minus = (x, y) => new Binary("-", x, y)
const times = (x, y) => new Binary("*", x, y)
const remainder = (x, y) => new Binary("%", x, y)
const power = (x, y) => new Binary("**", x, y)
const negate = (x) => new Unary("-", x)
const cond = (c, x, y) => new Conditional(c, x, y)
const eq = (x, y) => new Binary("==", x, y)
const noteq = (x, y) => new Binary("!=", x, y)
const less = (x, y) => new Binary("<", x, y)
const lesseq = (x, y) => new Binary("<=", x, y)
const greater = (x, y) => new Binary(">", x, y)
const greatereq = (x, y) => new Binary(">=", x, y)
const call = (f, a) => new Call(f, a)
const and = (x, y) => new Binary("&&", x, y)
const or = (x, y) => new Binary("||", x, y)
const not = (x, y) => new Unary("not", x)

// Examples of use

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
  P(
    program([
      vardec("x", 3),
      vardec("y", plus("x", 10)),
      print("x"),
      print("y"),
    ])
  )
)

console.log(
  P(
    program([
      fundec("plus2", ["x"], plus("x", 2)),
      print(call("plus2", [8])),
      print(call("plus2", [55])),
    ])
  )
)

console.log(P(program([print(cond(not(eq(3, 9)), negate(100), 200))])))
