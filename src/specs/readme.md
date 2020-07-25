# Property based testing

In the files 01-eq, 02-ord, 03-semigroup and 04-monoid we saw that instances must comply with some laws.

So how can we ensure that our instances are lawful?
**Property based testing**

Property based testing is another way to test your code which is complementary to classical unit-test methods.

It tries to discover inputs causing a property to be falsy by testing it against multiple generated random entries. In case of failure, a property based testing framework provides both a counterexample and the seed causing the generation.

Let's apply property based testing to the Semigroup law:

Associativity: `concat(concat(x, y), z) = concat(x, concat(y, z))`

**Library that makes easy to test type classes laws:** [fp-ts-laws](https://github.com/gcanti/fp-ts-laws)
