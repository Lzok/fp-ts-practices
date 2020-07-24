import logger from './utils/logger';

// Credits https://dev.to/gcanti/getting-started-with-fp-ts-semigroup-2mf7

/*
    A semigroup is a pair (A, *) in which A is a non-empty set and * is a binary associative operation on A,
    i.e. a function that takes two elements of A as input and returns an element of A as output...

    *: (x: A, y: A) => A

    ... while associative means that the equation

    (x * y) * z = x * (y * z)

    holds for all x, y, z in A.

    Associativity simply tells us that we do not have to worry about parenthesizing an expression and can write x * y * z.

        Semigroups capture the essence of parallelizable operations

    There are plenty of examples of semigroups:

        (number, *) where * is the usual multiplication of numbers
        (string, +) where + is the usual concatenation of strings
        (boolean, &&) where && is the usual conjunction

    and many more.
*/

// Here is the Semigroup type class implemented as a TypeScript interface, where the operation * is named concat
interface Semigroup<A> {
	concat: (x: A, y: A) => A;
}

/*
    The following law must hold

    Associativity: concat(concat(x, y), z) = concat(x, concat(y, z)), for all x, y, z in A

    The name concat makes a particular sense for arrays (see later) but, based on the context and the
    type A for which we are implementing an instance, the semigroup operation can be interpreted with different meanings

        "concatenation"
        "merging"
        "fusion"
        "selection"
        "addition"
        "substitution"

    and many more.
*/

// Semigroup instances

// semigroup (number, *)
/** number `Semigroup` under multiplication */
const semigroupProduct: Semigroup<number> = {
	concat: (x, y) => x * y,
};
logger.info('Semigroup Product: ', semigroupProduct.concat(2, 3));

// semigroup (number, +) where + is the usual addition of numbers
/** number `Semigroup` under addition */
const semigroupSum: Semigroup<number> = {
	concat: (x, y) => x + y,
};
logger.info('Semigroup Sum: ', semigroupSum.concat(2, 3));

// Another example, with strings this time
const semigroupString: Semigroup<string> = {
	concat: (x, y) => x + y,
};
logger.info('Semigroup String: ', semigroupString.concat('Hello ', 'World'));

/////////////////////////////////

// What if, given a type A, you can't find an associative operation on A?
// You can create a (trivial) semigroup instance for every type just using the following constructions
/** Always return the first argument */
function getFirstSemigroup<A = never>(): Semigroup<A> {
	return { concat: (x, _) => x };
}
logger.info('Semigroup getFirst: ', getFirstSemigroup<number>().concat(3, 5));

/** Always return the second argument */
function getLastSemigroup<A = never>(): Semigroup<A> {
	return { concat: (_, y) => y };
}
logger.info('Semigroup getLast: ', getLastSemigroup<string>().concat('First', 'Second'));

// Another technique is to define a semigroup instance for Array<A> (*), called the free semigroup of A.
// (*) strictly speaking is a semigroup instance for non empty arrays of A
function getArraySemigroup<A = never>(): Semigroup<Array<A>> {
	return { concat: (x, y) => x.concat(y) };
}
logger.info('Semigroup getArray: ', getArraySemigroup<string>().concat([], ['Another']));

// and map the elements of A to the singleton elements of Array<A>
function of<A>(a: A): Array<A> {
	return [a];
}

///////////////////////////////////////////

// Deriving from Ord
// if we already have an Ord instance for A, then we can "turn it" into a semigroup.
// Actually two possible semigroups
import { ordNumber, ordString } from 'fp-ts/lib/Ord';
import { getMeetSemigroup, getJoinSemigroup } from 'fp-ts/lib/Semigroup';

/** Takes the minimum of two values */
const semigroupMin: Semigroup<number> = getMeetSemigroup(ordNumber);

/** Takes the maximum of two values  */
const semigroupMax: Semigroup<number> = getJoinSemigroup(ordNumber);

semigroupMin.concat(2, 1); // 1
semigroupMax.concat(2, 1); // 2

const semigroupMinStr: Semigroup<string> = getMeetSemigroup(ordString);
const semigroupMaxStr: Semigroup<string> = getJoinSemigroup(ordString);

logger.info('semigroupMinStr.concat("one", "two"): ', semigroupMinStr.concat('one', 'two'));
logger.info('semigroupMaxStr.concat("one", "two"): ', semigroupMaxStr.concat('two', 'bee'));

//////////////////////////////////////////

// Semigroup instances for more complex types
type Point = {
	x: number;
	y: number;
};

const semigroupPoint: Semigroup<Point> = {
	concat: (p1, p2) => ({
		x: semigroupSum.concat(p1.x, p2.x),
		y: semigroupSum.concat(p1.y, p2.y),
	}),
};

const p1 = { x: 10, y: 15 };
const p2 = { x: 3, y: 5 };
const p3 = { x: 8, y: 2 };
const p4 = { x: 8, y: 2 };
logger.info('semigroupPoint.concat(p1, p2): ', semigroupPoint.concat(p1, p2));

// we can build a Semigroup instance for a struct like Point if we
// can provide a Semigroup instance for each field.
// Indeed the fp-ts/lib/Semigroup module exports a getStructSemigroup combinator:
import { getStructSemigroup } from 'fp-ts/lib/Semigroup';

// This is the same as semigroupPoint declared previously
const semigroupPointB: Semigroup<Point> = getStructSemigroup({
	x: semigroupSum,
	y: semigroupSum,
});

logger.info('semigroupPointB.concat(p1, p2): ', semigroupPointB.concat(p1, p2));

// We can go on and feed getStructSemigroup with the instance just defined
type Vector = {
	from: Point;
	to: Point;
};

const v1 = { from: p1, to: p2 };
const v2 = { from: p3, to: p4 };

const semigroupVector: Semigroup<Vector> = getStructSemigroup({
	from: semigroupPoint,
	to: semigroupPoint,
});

logger.info('semigroupVector.concat(v1, v2): ', semigroupVector.concat(v1, v2));
