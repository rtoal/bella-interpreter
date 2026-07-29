import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as bella from "../bella.js";

const id = (i: string) => new bella.Identifier(i);
const num = (n: number) => new bella.Numeral(n);
const bool = (x: boolean) => new bella.BooleanLiteral(x);
const unary = (op: string, x: bella.Expression) =>
  new bella.UnaryExpression(op, x);
const binary = (op: string, x: bella.Expression, y: bella.Expression) =>
  new bella.BinaryExpression(op, x, y);
const cond = (
  test: bella.Expression,
  consequent: bella.Expression,
  alternate: bella.Expression
) => new bella.ConditionalExpression(test, consequent, alternate);
const arr = (elements: bella.Expression[]) => new bella.ArrayLiteral(elements);
const sub = (array: bella.Expression, subscript: bella.Expression) =>
  new bella.SubscriptExpression(array, subscript);
const call = (callee: bella.Identifier, args: bella.Expression[]) =>
  new bella.Call(callee, args);
const print = (x: bella.Expression) => new bella.PrintStatement(x);
const vardec = (i: bella.Identifier, e: bella.Expression) =>
  new bella.VariableDeclaration(i, e);
const fundec = (
  i: bella.Identifier,
  params: bella.Identifier[],
  e: bella.Expression
) => new bella.FunctionDeclaration(i, params, e);
const assign = (i: bella.Identifier, e: bella.Expression) =>
  new bella.Assignment(i, e);
const whilestmt = (test: bella.Expression, b: bella.Block) =>
  new bella.WhileStatement(test, b);
const block = (s: bella.Statement[]) => new bella.Block(s);
const program = (b: bella.Block) => new bella.Program(b);

describe("The interpreter", () => {
  it("interprets numerals ok", () => {
    assert.equal(num(8).interpret(new Map()), 8);
  });
  it("interprets identifier expressions ok", () => {
    const m = new Map([
      ["x", 1],
      ["y", 2],
    ]);
    assert.equal(id("x").interpret(m), 1);
    assert.equal(id("y").interpret(m), 2);
    assert.throws(() => id("z").interpret(m));
  });
  it("interprets unary expressions ok", () => {
    const m = new Map<string, bella.Value>([
      ["x", 1],
      ["a", true],
      ["b", false],
    ]);
    assert.equal(unary("-", num(8)).interpret(m), -8);
    assert.equal(unary("-", id("x")).interpret(m), -1);
    assert.throws(() => unary("-", id("y")).interpret(m));
    assert.equal(unary("!", bool(true)).interpret(m), false);
    assert.equal(unary("!", bool(false)).interpret(m), true);
    assert.equal(unary("!", id("a")).interpret(m), false);
    assert.equal(unary("!", id("b")).interpret(m), true);
  });
  it("interprets binary expressions ok", () => {
    const m = new Map<string, bella.Value>([
      ["x", 1],
      ["y", 2],
      ["a", true],
      ["b", false],
    ]);
    assert.equal(binary("+", id("x"), num(8)).interpret(m), 9);
    assert.throws(() => binary("+", id("x"), id("z")).interpret(m));
    assert.equal(binary("-", id("x"), num(8)).interpret(m), -7);
    assert.throws(() => binary("-", id("x"), id("z")).interpret(m));
    assert.equal(binary("*", id("x"), num(8)).interpret(m), 8);
    assert.throws(() => binary("*", id("x"), id("z")).interpret(m));
    assert.equal(binary("/", num(8), id("y")).interpret(m), 4);
    assert.throws(() => binary("/", id("x"), id("z")).interpret(m));
    assert.equal(binary("%", id("y"), num(9)).interpret(m), 2 % 9);
    assert.throws(() => binary("%", id("x"), id("z")).interpret(m));
    assert.equal(binary("**", num(2), num(10)).interpret(m), 1024);
    assert.throws(() => binary("**", id("x"), id("z")).interpret(m));
    assert.equal(binary("==", num(8), num(9)).interpret(m), false);
    assert.equal(binary("!=", num(8), num(9)).interpret(m), true);
    assert.equal(binary("<=", num(8), num(9)).interpret(m), true);
    assert.equal(binary("<", num(8), num(9)).interpret(m), true);
    assert.equal(binary(">", num(8), num(9)).interpret(m), false);
    assert.equal(binary(">=", num(8), num(9)).interpret(m), false);
    assert.equal(binary("&&", bool(true), bool(false)).interpret(m), false);
    assert.equal(binary("||", bool(true), bool(false)).interpret(m), true);
  });
  it("interprets conditional expressions ok", () => {
    const m = new Map<string, bella.Value>([]);
    assert.equal(cond(bool(true), num(1), num(2)).interpret(m), 1);
    assert.equal(cond(bool(false), num(1), num(2)).interpret(m), 2);
  });
  it("interprets array literals ok", () => {
    const m = new Map<string, bella.Value>([]);
    assert.deepEqual(arr([num(1), num(2), num(3)]).interpret(m), [1, 2, 3]);
    assert.deepEqual(arr([]).interpret(m), []);
  });
  it("interprets subscript expressions ok", () => {
    const m = new Map<string, bella.Value>([]);
    const a = arr([num(8), num(9)]);
    assert.equal(sub(a, num(0)).interpret(m), 8);
    assert.equal(sub(a, num(1)).interpret(m), 9);
    assert.throws(() => sub(a, num(2)).interpret(m));
    assert.throws(() => sub(a, bool(true)).interpret(m));
    assert.throws(() => sub(num(8), num(0)).interpret(m));
  });
  it("interprets calls to built-in functions ok", () => {
    const m = new Map<string, bella.Value>([["sqrt", Math.sqrt as bella.Value]]);
    assert.equal(call(id("sqrt"), [num(16)]).interpret(m), 4);
    assert.throws(() => call(id("cos"), [num(0)]).interpret(m));
  });
  it("interprets calls to user-defined functions ok", () => {
    const m = new Map<string, bella.Value>([
      ["double", [[id("x")], binary("*", id("x"), num(2))]],
    ]);
    assert.equal(call(id("double"), [num(21)]).interpret(m), 42);
    assert.throws(() => call(id("double"), [num(21), num(1)]).interpret(m));
    assert.throws(() => call(id("triple"), [num(21)]).interpret(m));
  });
  it("interprets print statements ok", () => {
    const m = new Map<string, bella.Value>([]);
    assert.deepEqual(print(num(8)).interpret([m, [1]]), [m, [1, 8]]);
  });
  it("interprets variable declarations ok", () => {
    const m = new Map<string, bella.Value>([]);
    const [m1] = vardec(id("x"), num(5)).interpret([m, []]);
    assert.equal(m1.get("x"), 5);
    assert.throws(() => vardec(id("x"), num(9)).interpret([m1, []]));
  });
  it("interprets function declarations ok", () => {
    const m = new Map<string, bella.Value>([]);
    const [m1] = fundec(id("triple"), [id("x")], binary("*", id("x"), num(3))).interpret([
      m,
      [],
    ]);
    assert.equal(call(id("triple"), [num(4)]).interpret(m1), 12);
    assert.throws(() =>
      fundec(id("triple"), [id("x")], num(0)).interpret([m1, []])
    );
  });
  it("interprets assignments ok", () => {
    const m = new Map<string, bella.Value>([["x", 5]]);
    const [m1] = assign(id("x"), num(9)).interpret([m, []]);
    assert.equal(m1.get("x"), 9);
    assert.throws(() => assign(id("y"), num(9)).interpret([m, []]));
  });
  it("interprets while statements ok", () => {
    const m = new Map<string, bella.Value>([["x", 0]]);
    const b = block([
      print(id("x")),
      assign(id("x"), binary("+", id("x"), num(1))),
    ]);
    const [, o] = whilestmt(binary("<", id("x"), num(3)), b).interpret([
      m,
      [],
    ]);
    assert.deepEqual(o, [0, 1, 2]);
  });
  it("interprets small programs ok", () => {
    let p = program(block([vardec(id("x"), num(5)), print(id("x"))]));
    assert.deepEqual(p.interpret(), [5]);
    p = program(
      block([print(unary("-", num(5))), print(binary("*", num(5), num(8)))])
    );
    assert.deepEqual(p.interpret(), [-5, 40]);
  });
  it("interprets a program with a function and a while loop ok", () => {
    const p = program(
      block([
        fundec(id("square"), [id("x")], binary("*", id("x"), id("x"))),
        vardec(id("i"), num(0)),
        whilestmt(
          binary("<", id("i"), num(3)),
          block([
            print(call(id("square"), [id("i")])),
            assign(id("i"), binary("+", id("i"), num(1))),
          ])
        ),
      ])
    );
    assert.deepEqual(p.interpret(), [0, 1, 4]);
  });
});
