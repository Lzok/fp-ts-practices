// Credits https://dev.to/gcanti/getting-started-with-fp-ts-monoid-ja0

// A Monoid is any Semigroup that happens to have a special value which is "neutral" with respect to concat.
// As usual in fp-ts the type class Monoid, contained in the fp-ts/lib/Monoid module,
// is implemented as a TypeScript interface, where the neutral value is named empty

import { Semigroup } from 'fp-ts/lib/Semigroup';
import logger from './utils/logger';

interface Monoid<A> extends Semigroup<A> {
	readonly empty: A;
}

/*
    The following laws must hold

    Right identity: concat(x, empty) = x, for all x in A
    Left identity: concat(empty, x) = x, for all x in A

    Whichever side of concat we put the value empty, it must make no difference to the value.

    Note. If an empty value exists then is unique.
*/

// Most of the semigroups saw in the 03-semigroup are actually Monoids
/** number `Monoid` under addition */
const monoidSum: Monoid<number> = {
	concat: (x, y) => x + y,
	empty: 0,
};
logger.info('monoidSum.concat(1, monoidSum.empty)', monoidSum.concat(1, monoidSum.empty)); // 1
logger.info('monoidSum.concat(monoidSum.empty, 1)', monoidSum.concat(monoidSum.empty, 1)); // 1

/** number `Monoid` under multiplication */
const monoidProduct: Monoid<number> = {
	concat: (x, y) => x * y,
	empty: 1,
};
logger.info('monoidProduct.concat(monoidProduct.empty, 10)', monoidProduct.concat(monoidProduct.empty, 10)); // 10
logger.info('monoidProduct.concat(10, monoidProduct.empty)', monoidProduct.concat(10, monoidProduct.empty)); // 10

const monoidString: Monoid<string> = {
	concat: (x, y) => x + y,
	empty: '',
};
logger.info('monoidString.concat(monoidString.empty, "Hey you")', monoidString.concat(monoidString.empty, 'Hey you')); // Hey you
logger.info('monoidString.concat("Hey you", monoidString.empty)', monoidString.concat('Hey you', monoidString.empty)); // Hey you

/** boolean monoid under conjunction */
const monoidAll: Monoid<boolean> = {
	concat: (x, y) => x && y,
	empty: true,
};
logger.info('monoidAll.concat(monoidAll.empty, false)', monoidAll.concat(monoidAll.empty, false)); // False
logger.info('monoidAll.concat(false, monoidAll.empty)', monoidAll.concat(false, monoidAll.empty)); // False

/** boolean monoid under disjunction */
const monoidAny: Monoid<boolean> = {
	concat: (x, y) => x || y,
	empty: false,
};
logger.info('monoidAny.concat(monoidAny.empty, true)', monoidAny.concat(monoidAny.empty, true)); // True
logger.info('monoidAny.concat(true, monoidAny.empty)', monoidAny.concat(true, monoidAny.empty)); // True

/////////////
// NOT ALL THE SEMIGROUPS ARE MONOIDS
/////////////
const semigroupSpace: Semigroup<string> = {
	concat: (x, y) => x + ' ' + y,
};
// We can't find an empty value such that concat(x, empty) = x.

///////////////////
// Monoid instance for a Point struct
//////////////////
type Point = {
	x: number;
	y: number;
};

const p1 = { x: 1, y: 3 };
const p2 = { x: 3, y: 5 };
const p3 = { x: 5, y: 8 };
const p4 = { x: 8, y: 13 };

// if we can provide a Monoid instance for each field
import { getStructMonoid } from 'fp-ts/lib/Monoid';

const monoidPoint: Monoid<Point> = getStructMonoid({
	x: monoidSum,
	y: monoidSum,
});

// { x: 4, y: 8 } because we defined monoidSum for the x and y
logger.info('monoidPoint.concat(p1, p2): ', monoidPoint.concat(p1, p2));

// We can go on and feed getStructMonoid with the instance just defined
type Vector = {
	from: Point;
	to: Point;
};

const v1 = { from: p1, to: p2 };
const v2 = { from: p3, to: p4 };

const monoidVector: Monoid<Vector> = getStructMonoid({
	from: monoidPoint,
	to: monoidPoint,
});

// Result: { from: { x: 6, y: 11 }, to: { x: 11, y: 18 } }
// from.x = p1.x + p3.x
// from.y = p1.y + p3.y
// to.x = p2.x + p4.x
// to.y = p2.y + p4.y
logger.info('monoidVector.concat(v1, v2): ', monoidVector.concat(v1, v2));

//////////////////////////////////////
//          FOLDING
//////////////////////////////////////

// When using a monoid instead of a semigroup, folding is even simpler:
// we don't need to explicitly provide an initial value
// (the implementation can use the monoid's empty value for that)

import { fold } from 'fp-ts/lib/Monoid';

logger.info('fold(monoidSum)([1, 2, 3, 4]): ', fold(monoidSum)([1, 2, 3, 4])); // 10
logger.info('fold(monoidProduct)([1, 2, 3, 4]): ', fold(monoidProduct)([1, 2, 3, 4])); // 24
logger.info('fold(monoidString)(["a", "b", "c"]): ', fold(monoidString)(['a', 'b', 'c'])); // 'abc'
logger.info('fold(monoidAll)([true, false, true]): ', fold(monoidAll)([true, false, true])); // false
logger.info('fold(monoidAny)([true, false, true]): ', fold(monoidAny)([true, false, true])); // true

///////////////////////////////
//   Monoids for type constructors
///////////////////////////////
//We already know that given a semigroup instance for A we can derive a semigroup instance for Option<A>.

// If we can find a monoid instance for A then we can derive a monoid instance for Option<A>
// (via getApplyMonoid) which works like this
/*
    x   y   concat(x, y)
    none none none
    some(a) none none
    none some(a) none
    some(a) some(b) some(concat(a, b))
*/

import { getApplyMonoid, some, none } from 'fp-ts/lib/Option';

const M = getApplyMonoid(monoidSum);

logger.info('M.concat(some(1), none): ', M.concat(some(1), none)); // none
logger.info('M.concat(some(1), some(2)): ', M.concat(some(1), some(2))); // some(3)
logger.info('M.concat(some(1), M.empty): ', M.concat(some(1), M.empty)); // some(1)

////////////////////////

// We can derive two other monoids for Option<A> (for all A)
// 1) getFirstMonoid...
// Monoid returning the left-most non-None value
/*
    x y concat(x, y)
    none none none
    some(a) none some(a)
    none some(a) some(a)
    some(a) some(b) some(a)
*/
import { getFirstMonoid } from 'fp-ts/lib/Option';

const Mf = getFirstMonoid<number>();

logger.info('Mf.concat(some(1), none): ', Mf.concat(some(1), none)); // some(1)
logger.info('Mf.concat(some(1), some(2)): ', Mf.concat(some(1), some(2))); // some(1)

// 2) ...and its dual: getLastMonoid
// Monoid returning the right-most non-None value
/*
    x y concat(x, y)
    none none none
    some(a) none some(a)
    none some(a) some(a)
    some(a) some(b) some(b)
*/
import { getLastMonoid } from 'fp-ts/lib/Option';

const Ml = getLastMonoid<number>();

logger.info('Ml.concat(some(1), none): ', Ml.concat(some(1), none)); // some(1)
logger.info('Ml.concat(some(1), some(2)): ', Ml.concat(some(1), some(2))); // some(2)

// getLastMonoid can be useful for managing optional values
import { Option } from 'fp-ts/lib/Option';

/** VSCode settings */
interface Settings {
	/** Controls the font family */
	fontFamily: Option<string>;
	/** Controls the font size in pixels */
	fontSize: Option<number>;
	/** Limit the width of the minimap to render at most a certain number of columns. */
	maxColumn: Option<number>;
}

const monoidSettings: Monoid<Settings> = getStructMonoid({
	fontFamily: getLastMonoid<string>(),
	fontSize: getLastMonoid<number>(),
	maxColumn: getLastMonoid<number>(),
});

const workspaceSettings: Settings = {
	fontFamily: some('Courier'),
	fontSize: none,
	maxColumn: some(80),
};

const userSettings: Settings = {
	fontFamily: some('Fira Code'),
	fontSize: some(12),
	maxColumn: none,
};

/** userSettings overrides workspaceSettings */
logger.info(
	'monoidSettings.concat(workspaceSettings, userSettings): ',
	monoidSettings.concat(workspaceSettings, userSettings)
);
/*
{ fontFamily: some("Fira Code"),
  fontSize: some(12),
  maxColumn: some(80) }
*/
