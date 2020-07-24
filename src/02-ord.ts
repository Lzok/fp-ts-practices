import logger from './utils/logger';

// Credits https://dev.to/gcanti/getting-started-with-fp-ts-ord-5f1e

// A type class Ord, intended to contain types that admit a total ordering, is declared in the following way
import { Eq } from 'fp-ts/lib/Eq';

type Ordering = -1 | 0 | 1;

interface IOrd<A> extends Eq<A> {
	readonly compare: (x: A, y: A) => Ordering;
}

/*
    We say that

        x < y if and only if compare(x, y) is equal to -1
        x is equal to y if and only if compare(x, y) is equal to 0
        x > y if and only if compare(x, y) is equal to 1

    As a consequence we can say that x <= y if and only if compare(x, y) <= 0

    As an example here's the instance of Ord for the type number
*/
const ordNumberA: IOrd<number> = {
	equals: (x, y) => x === y,
	compare: (x, y) => (x < y ? -1 : x > y ? 1 : 0),
};

/*
    Instances must satisfy the following laws:

    Reflexivity: compare(x, x) === 0, for all x in A
    Antisymmetry: if compare(x, y) <= 0 and compare(y, x) <= 0 then x is equal to y, for all x, y in A
    Transitivity: if compare(x, y) <= 0 and compare(y, z) <= 0 then compare(x, z) <= 0, for all x, y, z in A

    Additionally compare must comply with Eq's equals:

    compare(x, y) === 0 if and only if equals(x, y) === true, for all x, y in A

    Note. A lawful equals can be derived from compare in the following way
    equals: (x, y) => compare(x, y) === 0

*/

// the module fp-ts/lib/Ord exports an handy fromCompare helper which allows you
// to define an Ord instance by simply specifying a compare function
import { Ord, fromCompare } from 'fp-ts/lib/Ord';

const ordNumber: Ord<number> = fromCompare((x, y) => (x < y ? -1 : x > y ? 1 : 0));

// We could then define a function min (which takes the minimum of two values) in the following way
function min<A>(O: Ord<A>): (x: A, y: A) => A {
	return (x, y) => (O.compare(x, y) === 1 ? y : x);
}

// 1
logger.info('min(ordNumber)(2,1)', min(ordNumber)(2, 1));

/*
    In more real examples, we will work with complex types.
    Take a User type for example.
    In this cases we have to define how the type class Ord will
    order our data. For this example we will tell the type class
    to order our users for their age.
*/
type User = {
	name: string;
	age: number;
};

const byAgeA: Ord<User> = fromCompare((x, y) => ordNumber.compare(x.age, y.age));

/*
    We can avoid some boilerplate by using the contramap combinator:
    given an instance of Ord for A and a function from B to A, we can derive an instance of Ord for B
*/
import { contramap } from 'fp-ts/lib/Ord';

// Function from B to A: User -> number
const fnContramap = (user: User): number => user.age;
const byAge: Ord<User> = contramap(fnContramap)(ordNumber);

const user1 = { name: 'Dimebag', age: 34 };
const user2 = { name: 'Mercury', age: 31 };

// Mercury will be the minor
logger.info('min(byAge)(user1, user2)', min(byAge)(user1, user2));

// With partial application
const getYounger = min(byAge);

// Same call as before but with this new fn
logger.info('getYounger(user1, user2)', getYounger(user1, user2));

// We can also reverse the order. We can achieve this with the "dual order"
import { getDualOrd } from 'fp-ts/lib/Ord';

function max<A>(O: Ord<A>): (x: A, y: A) => A {
	return min(getDualOrd(O));
}

const getOlder = max(byAge);

// Dimebag will be the older
logger.info('getOlder(user1, user2)', getOlder(user1, user2));
