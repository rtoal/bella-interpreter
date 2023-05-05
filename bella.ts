// Bella Interpreter

// Abstract Syntax
//   n: Nml
//   i: Ide
//   e: Exp = n | i | true | false | uop e | e bop e | e ? e : e
//          | i e* | [ e* ] | e[e]
//   s: Stm = let i = e | func i i* = e | i = e | print e | while e b
//   b: Blo = block s*
//   p: Pro = program b

// Semantic domains

type BuiltInFunction = (...args: Value[]) => Value;
type UserFunction = [Identifier[], Expression];
type Value = number | boolean | Value[] | BuiltInFunction | UserFunction;

type Memory = Map<string, Value>;
type Output = Value[];
type State = [Memory, Output];

// Custom type guards

function isUserFunction(v: Value): v is UserFunction {
  return Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2;
}

function isBuiltInFunction(v: Value): v is BuiltInFunction {
  return typeof v === "function";
}

function isArray(x: Value): x is Value[] {
  return Array.isArray(x);
}

// Semantic Functions

export interface Expression {
  interpret(m: Memory): Value;
}

export class Numeral implements Expression {
  constructor(public value: number) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class BooleanLiteral implements Expression {
  constructor(public value: boolean) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class Identifier implements Expression {
  constructor(public name: string) {}
  interpret(m: Memory): Value {
    const entity = m.get(this.name);
    if (entity === undefined) {
      throw new Error("Identifier not declared");
    }
    return entity;
  }
}

export class UnaryExpression implements Expression {
  constructor(public operator: string, public expression: Expression) {}
  interpret(m: Memory): Value {
    const x = this.expression.interpret(m);
    if (this.operator === "-") {
      if (typeof x !== "number") {
        throw new Error("Operand must be a number");
      }
      return -x;
    } else if (this.operator === "!") {
      if (typeof x !== "boolean") {
        throw new Error("Operand must be a boolean");
      }
      return !x;
    }
    throw new Error("Unknown operator");
  }
}

export class BinaryExpression implements Expression {
  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression
  ) {}
  interpret(m: Memory): Value {
    const [x, y] = [this.left.interpret(m), this.right.interpret(m)];
    if (["+", "-", "*", "/"].includes(this.operator)) {
      if (typeof x !== "number" || typeof y !== "number") {
        throw new Error("Operands must be numbers");
      }
      switch (this.operator) {
        case "+":
          return x + y;
        case "-":
          return x - y;
        case "*":
          return x * y;
        case "/":
          return x / y;
        case "%":
          return x % y;
        case "**":
          return x ** y;
      }
    } else if (["<", "<=", "==", "!=", ">=", ">"].includes(this.operator)) {
      if (typeof x !== "number" || typeof y !== "number") {
        throw new Error("Operands must be numbers");
      }
      switch (this.operator) {
        case "<":
          return x < y;
        case "<=":
          return x <= y;
        case "==":
          return x === y;
        case "!=":
          return x !== y;
        case ">=":
          return x >= y;
        case ">":
          return x > y;
      }
    } else if (["&&", "||"].includes(this.operator)) {
      if (typeof x !== "boolean" || typeof y !== "boolean") {
        throw new Error("Operands must be booleans");
      }
      switch (this.operator) {
        case "&&":
          return x && y;
        case "||":
          return x || y;
      }
    }
    throw new Error("Unknown operator");
  }
}

export class Call implements Expression {
  constructor(public callee: Identifier, public args: Expression[]) {}
  interpret(m: Memory): Value {
    const functionValue = m.get(this.callee.name);
    const argValues = this.args.map((arg) => arg.interpret(m));
    if (functionValue === undefined) {
      throw new Error("Identifier was undeclared");
    } else if (isUserFunction(functionValue)) {
      const [parameters, expression] = functionValue;
      if (parameters.length !== this.args.length) {
        throw new Error("Wrong number of arguments");
      }
      const locals = parameters.map((p, i) => [p.name, argValues[i]] as const);
      return expression.interpret(new Map([...m, ...locals]));
    } else if (isBuiltInFunction(functionValue)) {
      return functionValue(...argValues);
    } else {
      throw new Error("Not a function");
    }
  }
}

export class ConditionalExpression implements Expression {
  constructor(
    public test: Expression,
    public consequent: Expression,
    public alternate: Expression
  ) {}
  interpret(m: Memory): Value {
    return this.test.interpret(m)
      ? this.consequent.interpret(m)
      : this.alternate.interpret(m);
  }
}

export class ArrayLiteral implements Expression {
  constructor(public elements: Expression[]) {}
  interpret(m: Memory): Value {
    return this.elements.map((e) => e.interpret(m));
  }
}

export class SubscriptExpression implements Expression {
  constructor(public array: Expression, public subscript: Expression) {}
  interpret(m: Memory): Value {
    const arrayValue = this.array.interpret(m);
    const subscriptValue = this.subscript.interpret(m);
    if (typeof subscriptValue !== "number") {
      throw new Error("Subscript must be a number");
    }
    if (!isArray(arrayValue)) {
      throw new Error("Not an array");
    }
    return arrayValue[subscriptValue];
  }
}

// Statements

export interface Statement {
  interpret([m, o]: State): State;
}

export class VariableDeclaration implements Statement {
  constructor(public id: Identifier, public expression: Expression) {}
  interpret([m, o]: State): State {
    if (m.has(this.id.name)) {
      throw new Error("Identifier already declared");
    }
    const initializer = this.expression.interpret(m);
    return [new Map([...m, [this.id.name, initializer]]), o];
  }
}

export class FunctionDeclaration implements Statement {
  constructor(
    public id: Identifier,
    public parameters: Identifier[],
    public expression: Expression
  ) {}
  interpret([m, o]: State): State {
    if (m.has(this.id.name)) {
      throw new Error("Identifier already declared");
    }
    const fun: UserFunction = [this.parameters, this.expression];
    return [new Map([...m, [this.id.name, fun]]), o];
  }
}

export class Assignment implements Statement {
  constructor(public id: Identifier, public expression: Expression) {}
  interpret([m, o]: State): State {
    if (!m.has(this.id.name)) {
      throw new Error("Variable not declared");
    }
    const initializer = this.expression.interpret(m);
    return [new Map([...m, [this.id.name, initializer]]), o];
  }
}

export class PrintStatement implements Statement {
  constructor(public expression: Expression) {}
  interpret([m, o]: State): State {
    return [m, [...o, this.expression.interpret(m)]];
  }
}

export class WhileStatement implements Statement {
  constructor(public expression: Expression, public block: Block) {}
  interpret([m, o]: State): State {
    let state: State = [m, o];
    while (this.expression.interpret(state[0])) {
      state = this.block.interpret(state);
    }
    return state;
  }
}

export class Block {
  constructor(public statements: Statement[]) {}
  interpret([m, o]: State): State {
    let state: State = [m, o];
    for (let statement of this.statements) {
      state = statement.interpret(state);
    }
    return state;
  }
}

export class Program {
  constructor(public block: Block) {}
  interpret(): Output {
    const initialMemory: Memory = new Map<string, Value>([
      ["pi", Math.PI as Value],
      ["sqrt", Math.sqrt as Value],
      ["sin", Math.sin as Value],
      ["cos", Math.cos as Value],
      ["ln", Math.log as Value],
      ["exp", Math.exp as Value],
      ["hypot", Math.hypot as Value],
    ]);
    const [_, o] = this.block.interpret([initialMemory, []]);
    return o;
  }
}

export function interpret(p: Program) {
  return p.interpret();
}
