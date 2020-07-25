// Credit https://dev.to/gcanti/introduction-to-property-based-testing-17nk
/*
    To test a Semigroup instance we need:

    1. a Semigroup<A> instance for the type A
    2. a property that encodes the associativity law
    2. a way to generate random values of type A

*/

// 1. Semigroup instance
import { Semigroup } from 'fp-ts/lib/Semigroup';
import * as fc from 'fast-check';

const S: Semigroup<string> = {
	concat: (x, y) => x + ' ' + y,
};

// 2. Property
// A property is just a predicate, i.e a function that returns a boolean.
// We say that the property holds if the predicate returns true.

// So in our case we can define the associativity property as
const associativity = (x: string, y: string, z: string) => S.concat(S.concat(x, y), z) === S.concat(x, S.concat(y, z));

// 3. Arbitrary<A>
// An Arbitrary<A> is responsible to generate random values of type A.
// We need an Arbitrary<string>, fast-check provides many built-in arbitraries
const arb: fc.Arbitrary<string> = fc.string();

it('Semigroup instance should be lawful', () => {
	fc.assert(fc.property(arb, arb, arb, associativity));
});
