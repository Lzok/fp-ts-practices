import logger from './utils/logger';

// Credits https://dev.to/gcanti/getting-started-with-fp-ts-setoid-39f3
// https://gcanti.github.io/fp-ts/modules/Eq.ts.html

/**
 * Type Class:
 * The programmer defines a type class by specifying a set of functions or constant names,
 * together with their respective types, that must exist for every type that belongs to the class.
 */

// A type class Eq, intended to contain types that admit equality, is declared in the following way
interface Eq<A> {
	/** returns `true` if `x` is equal to `y` */
	readonly equals: (x: A, y: A) => boolean;
}

/**
 * The declaration may be read as:
 * a type A belongs to type class Eq if there is a function named equal of the appropriate type, defined on it
 */

// This is an instance of Eq for the type number
const eqNumber: Eq<number> = {
	equals: (x, y) => x === y,
};

logger.info('eqNumber.equals(2,3)', eqNumber.equals(2, 3));
logger.info('eqNumber.equals(2,2)', eqNumber.equals(2, 2));

// Argument of type '"hi"' is not assignable to parameter of type 'number'
// logger.info(eqNumber.equals(2, 'hi'));

/**
 * Instances must satisfy the following laws:
 *   Reflexivity: equals(x, x) === true, for all x in A
 *   Symmetry: equals(x, y) === equals(y, x), for all x, y in A
 *   Transitivity: if equals(x, y) === true and equals(y, z) === true, then equals(x, z) === true, for all x, y, z in A

 */

// function elem (which determines if an element is in an array)
function elem<A>(E: Eq<A>): (a: A, as: Array<A>) => boolean {
	return (a, as) => as.some((item) => E.equals(item, a));
}

// true
logger.info('elem(eqNumber)(1, [1, 2, 3])', elem(eqNumber)(1, [1, 2, 3]));

// false
logger.info('elem(eqNumber)(4, [1, 2, 3])', elem(eqNumber)(4, [1, 2, 3]));

// Eq instances for more complex types
type Point = {
	x: number;
	y: number;
};

const eqPointManual: Eq<Point> = {
	equals: (p1, p2) => p1.x === p2.x && p1.y === p2.y,
};

// eqPoint but first checks reference equality
const eqPointManualB: Eq<Point> = {
	equals: (p1, p2) => p1 === p2 || (p1.x === p2.x && p1.y === p2.y),
};

// We can build an Eq instance for a struct like Point if we can provide an Eq instance for each field.
import { getStructEq } from 'fp-ts/lib/Eq';

const eqPoint: Eq<Point> = getStructEq({
	x: eqNumber,
	y: eqNumber,
});

type Vector = {
	from: Point;
	to: Point;
};

const eqVector: Eq<Vector> = getStructEq({
	from: eqPoint,
	to: eqPoint,
});

const point1: Point = { x: 1, y: 2 };
const point2: Point = { x: 1, y: 2 };

const point3: Point = { x: 2, y: 3 };
const point4: Point = { x: 3, y: 4 };

const point5: Point = { x: 10, y: 4 };
const point6: Point = { x: 10, y: 4 };
const point7: Point = { x: 10, y: 4 };
const point8: Point = { x: 10, y: 4 };

// true
logger.info('Point1 and Point2 applied to eqPoint', eqPoint.equals(point1, point2));

// false
logger.info('Point1 and Point3 applied to eqPoint', eqPoint.equals(point1, point3));

const vector1: Vector = { from: point1, to: point2 };
const vector2: Vector = { from: point3, to: point4 };
const vector3: Vector = { from: point5, to: point6 };
const vector4: Vector = { from: point7, to: point8 };

// false
logger.info('Vector1 and Vector2 applied to eqVector', eqVector.equals(vector1, vector2));

// true
logger.info('Vector3 and Vector4 applied to eqVector', eqVector.equals(vector3, vector4));

// a combinator that allows to derive an Eq instance for arrays
import { getEq } from 'fp-ts/lib/Array';

const eqArrayOfPoints: Eq<Array<Point>> = getEq(eqPoint);
const arrPointA: Array<Point> = [point5, point6];
const arrPointB: Array<Point> = [point7, point8];

// true
logger.info('eqArrayOfPoints.equals(arrPointA, arrPointB)', eqArrayOfPoints.equals(arrPointA, arrPointB));

/**
 * another useful way to build an Eq instance is the contramap combinator:
 * given an instance of Eq for A and a function from B to A, we can derive an instance of Eq for B
 */
// eslint-disable-next-line import/no-duplicates
import { contramap } from 'fp-ts/lib/Eq';

type User = {
	userId: number;
	name: string;
};

/** two users are equal if their `userId` field is equal */
const eqUser = contramap((user: User) => user.userId)(eqNumber);
const user1 = { userId: 1, name: 'Serj' };
const user2 = { userId: 2, name: 'Morello' };
const user3 = { userId: 1, name: 'Geezer' };

// false
logger.info('eqUser.equals(user1, user2)', eqUser.equals(user1, user2));

// true
logger.info('eqUser.equals(user1, user3)', eqUser.equals(user1, user3));
