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
export type Value = number | boolean | Value[] | BuiltInFunction | UserFunction;

type Memory = Map<string, Value>;
type Output = Value[];
type State = [Memory, Output];

export type UnaryOperator = "-" | "!";
export type ArithmeticOperator = "+" | "-" | "*" | "/" | "%" | "**";
export type RelationalOperator = "<" | "<=" | "==" | "!=" | ">=" | ">";
export type BooleanOperator = "&&" | "||";
export type BinaryOperator =
  | ArithmeticOperator
  | RelationalOperator
  | BooleanOperator;

// Custom type guards

function isUserFunction(v: Value): v is UserFunction {
  return Array.isArray(v) && v.length === 2 && Array.isArray(v[0]);
}

function isBuiltInFunction(v: Value): v is BuiltInFunction {
  return typeof v === "function";
}

function isArray(x: Value): x is Value[] {
  return Array.isArray(x);
}

const ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/", "%", "**"]);
const RELATIONAL_OPERATORS = new Set(["<", "<=", "==", "!=", ">=", ">"]);
const BOOLEAN_OPERATORS = new Set(["&&", "||"]);

function isArithmeticOperator(op: BinaryOperator): op is ArithmeticOperator {
  return ARITHMETIC_OPERATORS.has(op);
}

function isRelationalOperator(op: BinaryOperator): op is RelationalOperator {
  return RELATIONAL_OPERATORS.has(op);
}

function isBooleanOperator(op: BinaryOperator): op is BooleanOperator {
  return BOOLEAN_OPERATORS.has(op);
}

// Exhaustiveness helper: a compile-time guarantee that every member of a
// union has been handled, so this is never actually reachable at runtime.
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

// Semantic Functions

export interface Expression {
  interpret(m: Memory): Value;
}

export class Numeral implements Expression {
  constructor(public readonly value: number) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class BooleanLiteral implements Expression {
  constructor(public readonly value: boolean) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class Identifier implements Expression {
  constructor(public readonly name: string) {}
  interpret(m: Memory): Value {
    const entity = m.get(this.name);
    if (entity === undefined) {
      throw new Error("Identifier not declared");
    }
    return entity;
  }
}

export class UnaryExpression implements Expression {
  constructor(
    public readonly operator: UnaryOperator,
    public readonly expression: Expression
  ) {}
  interpret(m: Memory): Value {
    const x = this.expression.interpret(m);
    switch (this.operator) {
      case "-":
        if (typeof x !== "number") {
          throw new TypeError("Operand must be a number");
        }
        return -x;
      case "!":
        if (typeof x !== "boolean") {
          throw new TypeError("Operand must be a boolean");
        }
        return !x;
      default:
        return assertNever(this.operator);
    }
  }
}

export class BinaryExpression implements Expression {
  constructor(
    public readonly operator: BinaryOperator,
    public readonly left: Expression,
    public readonly right: Expression
  ) {}
  interpret(m: Memory): Value {
    const [x, y] = [this.left.interpret(m), this.right.interpret(m)];
    if (isArithmeticOperator(this.operator)) {
      if (typeof x !== "number" || typeof y !== "number") {
        throw new TypeError("Operands must be numbers");
      }
      return this.#arithmetic(this.operator, x, y);
    } else if (isRelationalOperator(this.operator)) {
      if (typeof x !== "number" || typeof y !== "number") {
        throw new TypeError("Operands must be numbers");
      }
      return this.#relational(this.operator, x, y);
    } else if (isBooleanOperator(this.operator)) {
      if (typeof x !== "boolean" || typeof y !== "boolean") {
        throw new TypeError("Operands must be booleans");
      }
      return this.#boolean(this.operator, x, y);
    }
    return assertNever(this.operator);
  }
  #arithmetic(op: ArithmeticOperator, x: number, y: number): number {
    switch (op) {
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
      default:
        return assertNever(op);
    }
  }
  #relational(op: RelationalOperator, x: number, y: number): boolean {
    switch (op) {
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
      default:
        return assertNever(op);
    }
  }
  #boolean(op: BooleanOperator, x: boolean, y: boolean): boolean {
    switch (op) {
      case "&&":
        return x && y;
      case "||":
        return x || y;
      default:
        return assertNever(op);
    }
  }
}

export class Call implements Expression {
  constructor(
    public readonly callee: Identifier,
    public readonly args: Expression[]
  ) {}
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
      // Safe: parameters.length === argValues.length, checked above.
      const locals = parameters.map((p, i) => [p.name, argValues[i]!] as const);
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
    public readonly test: Expression,
    public readonly consequent: Expression,
    public readonly alternate: Expression
  ) {}
  interpret(m: Memory): Value {
    return this.test.interpret(m)
      ? this.consequent.interpret(m)
      : this.alternate.interpret(m);
  }
}

export class ArrayLiteral implements Expression {
  constructor(public readonly elements: Expression[]) {}
  interpret(m: Memory): Value {
    return this.elements.map((e) => e.interpret(m));
  }
}

export class SubscriptExpression implements Expression {
  constructor(
    public readonly array: Expression,
    public readonly subscript: Expression
  ) {}
  interpret(m: Memory): Value {
    const arrayValue = this.array.interpret(m);
    const subscriptValue = this.subscript.interpret(m);
    if (typeof subscriptValue !== "number") {
      throw new TypeError("Subscript must be a number");
    }
    if (!isArray(arrayValue)) {
      throw new Error("Not an array");
    }
    const element = arrayValue[subscriptValue];
    if (element === undefined) {
      throw new Error("Subscript out of range");
    }
    return element;
  }
}

// Statements

export interface Statement {
  interpret([m, o]: State): State;
}

export class VariableDeclaration implements Statement {
  constructor(
    public readonly id: Identifier,
    public readonly expression: Expression
  ) {}
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
    public readonly id: Identifier,
    public readonly parameters: Identifier[],
    public readonly expression: Expression
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
  constructor(
    public readonly id: Identifier,
    public readonly expression: Expression
  ) {}
  interpret([m, o]: State): State {
    if (!m.has(this.id.name)) {
      throw new Error("Variable not declared");
    }
    const initializer = this.expression.interpret(m);
    return [new Map([...m, [this.id.name, initializer]]), o];
  }
}

export class PrintStatement implements Statement {
  constructor(public readonly expression: Expression) {}
  interpret([m, o]: State): State {
    return [m, [...o, this.expression.interpret(m)]];
  }
}

export class WhileStatement implements Statement {
  constructor(
    public readonly expression: Expression,
    public readonly block: Block
  ) {}
  interpret([m, o]: State): State {
    let state: State = [m, o];
    while (this.expression.interpret(state[0])) {
      state = this.block.interpret(state);
    }
    return state;
  }
}

export class Block {
  constructor(public readonly statements: Statement[]) {}
  interpret([m, o]: State): State {
    let state: State = [m, o];
    for (let statement of this.statements) {
      state = statement.interpret(state);
    }
    return state;
  }
}

export class Program {
  constructor(public readonly block: Block) {}
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
