# Bella Semantics and Interpreter

Bella is a simple programming language designed in a Programming Language Semantics class.

This interpreter was put together during a three hour session with a couple of students in the class.

It’s a typical Node application, so if you had a file named \*\* like so:

```
TODO
```

Then running the interpreter would do the expected thing:

```
TODO
```

The interpreter was written quickly to model the semantics, but at the same time model some alternatives including a very nasty hack in the way “memories” are handled. It’s as if the interpreter can’t tell whether it wants to feel functional or imperative. It uses mutable memories and keeps them all on a stack. As was mentioned above, it was a three hour hack effort.
