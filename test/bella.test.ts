import * as assert from "assert/strict";
import * as bella from "../bella.js";

const id = (i: string) => new bella.Identifier(i);
const num = (n: number) => new bella.Numeral(n);
const bool = (x: boolean) => new bella.BooleanLiteral(x);
const unary = (op: string, x: bella.Expression) =>
  new bella.UnaryExpression(op, x);
const binary = (op: string, x: bella.Expression, y: bella.Expression) =>
  new bella.BinaryExpression(op, x, y);
const print = (x: bella.Expression) => new bella.PrintStatement(x);
const vardec = (i: bella.Identifier, e: bella.Expression) =>
  new bella.VariableDeclaration(i, e);
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
  it("interprets small programs ok", () => {
    let p = program(block([vardec(id("x"), num(5)), print(id("x"))]));
    assert.deepEqual(p.interpret(), [5]);
    p = program(
      block([print(unary("-", num(5))), print(binary("*", num(5), num(8)))])
    );
    assert.deepEqual(p.interpret(), [-5, 40]);
  });
});
