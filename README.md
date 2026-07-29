# bella-interpreter

Interpreter for a little language built for a Programming Language Foundations class.

The input is an abstract syntax representation of a program in the language "Bella 2" which is an extension of the [Bella](https://cs.lmu.edu/~ray/notes/bella/) language. The abstract syntax of Bella 2 is:

```
   n: Nml
   i: Ide
   e: Exp = n | i | true | false | uop e | e bop e | e ? e : e
          | i e* | [ e* ] | e[e]
   s: Stm = let i = e | func i i* = e | i = e | print e | while e b
   b: Blo = block s*
   p: Pro = program b
```
