import ohm from "ohm-js"
import fs from "fs"

const grammar = ohm.grammar(fs.readFileSync("bella.ohm"))

function validate(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const savedMemories = []
let memory = {
  π: { type: "NUM", value: Math.PI, access: "RO" },
  sqrt: { type: "FUN", value: Math.sqrt, params: 1 },
  sin: { type: "FUN", value: Math.sin, params: 1 },
  cos: { type: "FUN", value: Math.cos, params: 1 },
  exp: { type: "FUN", value: Math.exp, params: 1 },
  ln: { type: "FUN", value: Math.log, params: 1 },
  hypot: { type: "FUN", value: Math.hypot, params: 2 },
}

const interpreter = grammar.createSemantics().addOperation("eval", {
  Program(body) {
    body.eval()
  },
  Statement_vardec(_let, id, _eq, initializer, _semicolon) {
    const newValue = initializer.eval()
    validate(memory[id.sourceString] === undefined, "Cannot RE-declare")
    memory[id.sourceString] = { type: "NUM", value: newValue, access: "RW" }
  },
  Statement_fundec(_fun, id, _open, params, _close, _equals, body, _semicolon) {
    validate(memory[id.sourceString] === undefined, "Cannot RE-declare")
    memory[id.sourceString] = {
      type: "FUN",
      params: params.asIteration().children.map((c) => c.sourceString),
      body: body,
    }
  },
  Statement_assign(id, _eq, expression, _semicolon) {
    const newValue = expression.eval()
    const entity = memory[id.sourceString]
    validate(entity !== undefined, "Undeclared identifier")
    validate(entity.type === "NUM", "Can only assign to numbers")
    validate(entity.access === "RW", "Cannot assign to read-only variable")
    memory[id.sourceString].value = newValue
  },
  Statement_print(_print, argument, _semicolon) {
    console.log(argument.eval())
  },
  Statement_while(_while, test, body) {
    function loop() {
      if (test.eval()) {
        body.eval()
        loop()
      }
    }
    loop()
  },
  Block(_open, body, _close) {
    body.eval()
  },
  Exp_unary(op, operand) {
    const x = operand.eval()
    switch (op.sourceString) {
      case "-":
        return -x
      case "!":
        return !x
    }
  },
  Exp_ternary(test, _questionMark, consequent, _colon, alternate) {
    return test.eval() ? consequent.eval() : alternate.eval()
  },
  Exp1_binary(left, _op, right) {
    return Number(left.eval() || right.eval())
  },
  Exp2_binary(left, _op, right) {
    return Number(left.eval() && right.eval())
  },
  Exp3_binary(left, op, right) {
    const [x, y] = [left.eval(), right.eval()]
    switch (op.sourceString) {
      case "<=":
        return Number(x <= y)
      case "<":
        return Number(x < y)
      case "==":
        return Number(x === y)
      case "!=":
        return Number(x !== y)
      case ">=":
        return Number(x >= y)
      case ">":
        return Number(x > y)
    }
  },
  Exp4_binary(left, op, right) {
    const [x, y] = [left.eval(), right.eval()]
    return op.sourceString === "+" ? x + y : x - y
  },
  Exp5_binary(left, op, right) {
    const [x, y] = [left.eval(), right.eval()]
    return { "*": () => x * y, "/": () => x / y, "%": () => x % y }[
      op.sourceString
    ]()
  },
  Exp6_binary(left, _op, right) {
    return left.eval() ** right.eval()
  },
  Exp7_parens(_open, expression, _close) {
    return expression.eval()
  },
  Exp7_id(id) {
    const entity = memory[id.sourceString]
    validate(entity !== undefined, `Undeclared identifier`)
    validate(entity?.type === "NUM", `Number expected`)
    return entity.value
  },
  Call(id, _left, args, _right) {
    const evaluatedArgs = args.asIteration().eval()
    const entity = memory[id.sourceString]
    validate(entity !== undefined, `Undeclared identifier`)
    validate(entity?.type === "FUN", `Can only call functions`)
    if ("body" in entity) {
      // User-defined, params and body in memory
      validate(
        entity.params.length === evaluatedArgs.length,
        "Wrong number of arguments"
      )
      // entity.params is an array of strings
      // evaluatedArgs is the values
      // {param1: arg1, param2: arg2, ...}
      const bindings = Object.fromEntries(
        entity.params.map((p, i) => [
          p,
          { type: "NUM", value: evaluatedArgs[i], access: "RO" },
        ])
      )
      savedMemories.push(memory)
      memory = { ...memory, ...bindings }
      const returnValue = entity.body.eval()
      memory = savedMemories.pop()
      return returnValue
    } else {
      // Built-in, the function to call is stored in entity.value
      validate(
        entity.params === evaluatedArgs.length,
        "Wrong number of arguments"
      )
      return entity.value(...evaluatedArgs)
    }
  },
  true(_) {
    return 1
  },
  false(_) {
    return 0
  },
  num(_whole, _point, _fraction, _e, _sign, _exponent) {
    return Number(this.source.contents)
  },
  _terminal() {
    return this.source.contents
  },
  _iter(...children) {
    return children.map((child) => child.eval())
  },
})

const source = fs.readFileSync(process.argv[2])
const match = grammar.match(source)

if (match.failed()) {
  throw new Error(match.message)
}
interpreter(match).eval()
