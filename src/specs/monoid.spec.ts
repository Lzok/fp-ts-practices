import { Semigroup } from 'fp-ts/lib/Semigroup';
import { Monoid } from 'fp-ts/lib/Monoid';
import * as fc from 'fast-check';

const S: Semigroup<string> = {
	concat: (x, y) => x + y,
};
const M: Monoid<string> = {
	...S,
	empty: '',
};

/*
    We must encode the Monoid laws as properties:

    Right identity : concat(x, empty) = x
    Left identity : concat(empty, x) = x

*/
const rightIdentity = (x: string) => M.concat(x, M.empty) === x;

const leftIdentity = (x: string) => M.concat(M.empty, x) === x;
const arb: fc.Arbitrary<string> = fc.string();

it('Monoid instance should be lawful', () => {
	fc.assert(fc.property(arb, rightIdentity));
	fc.assert(fc.property(arb, leftIdentity));
});
