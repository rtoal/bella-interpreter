# Bella Semantics and Interpreter

Bella is a simple programming language designed in a Programming Language Semantics class.

## Example

```
let x = 3;
while x < 10 {
  print x;
  x = x + 2;
}
```

This program outputs 3 5 7 9

## Abstract Syntax

```
p: Prog
c: Cond
e: Exp
s: Stmt
i: Ide
n: Numeral

Prog ::= s*
Exp  ::= n | i | e + e | e - e | e * e | e / e
      |  e ** e | - e | i e* | c ? e1 : e2
Cond ::= true | false | ~ c | c && c | c || c
      |  e == e | e != e | e < e | e <= e
      |  e > e | e >= e
Stmt ::= let i e | i = e | while c s* | print e
      |  fun i i* e
```

## Denotational Semantics

```
type File = Num*
type Memory = Ide -> Num  (in JS, a Map; in Python a dict)
type State = Memory x File

𝒫: Prog -> File
ℰ: Exp -> Memory -> Num
𝒮: Stmt -> State -> State
𝒞: Cond -> Memory -> Bool

𝒫⟦s*⟧= S*⟦s*⟧({}, [])

𝒮⟦let i e⟧(m,o) = ({...m, i: E⟦e⟧m})
𝒮⟦fun i i* e⟧(m,o) = ({...m, i: (i*, e)})
𝒮⟦i = e⟧(m,o) = ({...m, i: E⟦e⟧m})
𝒮⟦print e⟧(m,o) = (m, o + E⟦e⟧m)
𝒮⟦while c do s*⟧(m,o) = if 𝒞⟦c1⟧m then 𝒮⟦while c do s*⟧(𝒮*⟦s*⟧(m,o)) else (m,o)

ℰ⟦n⟧m = n
ℰ⟦i⟧m = m[i]
ℰ⟦e1 + e2⟧m = ℰ⟦e1⟧m + ℰ⟦e2⟧m
ℰ⟦e1 - e2⟧m = ℰ⟦e1⟧m - ℰ⟦e2⟧m
ℰ⟦e1 * e2⟧m = ℰ⟦e1⟧m * ℰ⟦e2⟧m
ℰ⟦e1 / e2⟧m = ℰ⟦e1⟧m / ℰ⟦e2⟧m
ℰ⟦e1 % e2⟧m = ℰ⟦e1⟧m % ℰ⟦e2⟧m
ℰ⟦e1 ** e2⟧m = ℰ⟦e1⟧m ** ℰ⟦e2⟧m
ℰ⟦- e⟧m = - ℰ⟦e⟧m
ℰ⟦i e*⟧m = let (p*, b) = m[f] in ℰ⟦e1⟧{...m, p[i]: e[i]}_i
ℰ⟦c ? e1 : e2⟧m = if 𝒞⟦c⟧m = T then ℰ⟦e1⟧m else ℰ⟦e2⟧m

𝒞⟦true⟧m = T
𝒞⟦false⟧m = F
𝒞⟦e1 == e2⟧m = ℰ⟦e1⟧m = ℰ⟦e2⟧m
𝒞⟦e1 != e2⟧m = not (ℰ⟦e1⟧m = ℰ⟦e2⟧m)
𝒞⟦e1 < e2⟧m = ℰ⟦e1⟧m < ℰ⟦e2⟧m
𝒞⟦e1 <= e2⟧m = ℰ⟦e1⟧m <= ℰ⟦e2⟧m
𝒞⟦e1 > e2⟧m = ℰ⟦e1⟧m > ℰ⟦e2⟧m
𝒞⟦e1 >= e2⟧m = ℰ⟦e1⟧m >= ℰ⟦e2⟧m
𝒞⟦~c⟧m = not (𝒞⟦c⟧m)
𝒞⟦c1 && c2⟧m = if 𝒞⟦c1⟧m then 𝒞⟦c2⟧m else F
𝒞⟦c1 || c2⟧m = if 𝒞⟦c1⟧m then T else 𝒞⟦c2⟧m
```

## Using the Interpreter

Call the P function with a program object, perhaps like so:

```
console.log(
  P(
    program([
      fundec("plus2", ["x"], plus("x", 2)),
      print(call("plus2", [8])),
      print(call("plus2", [55])),
    ])
  )
)
```
