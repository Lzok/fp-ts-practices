// Credit https://kdev.to/gcanti/getting-started-with-fp-ts-applicative-1kb3
/*
    In 06-functor we saw that we can compose an effectful program f: (a: A) => F<B>
    with a pure program g: (b: B) => C by lifting g to a function
    lift(g): (fb: F<B>) => F<C> provided that F admits a functor instance
    
    Program f       Program g     Composition
    pure            pure          g ∘ f
    effectful       pure (unary)  lift(g) ∘ f

    However g must be unary, that is it must accept only one argument as input.
    What if g accepts two arguments? Can we still lift g by using only the functor instance? Well, let's try!
*/

/*
    Currying

    First of all we must model a function that accepts two arguments,
    let's say of type B and C (we can use a tuple) and returns a value of type D
    g: (args: [B, C]) => D

    We can rewrite g using a technique called currying.
    Currying is the technique of translating the evaluation of a function that takes
    multiple arguments into evaluating a sequence of functions, each with a single argument.
    For example, a function that takes two arguments, one from B and one from C,
    and produces outputs in D, by currying is translated into a function that takes a single
    argument from C and produces as outputs functions from B to C.
    https://en.wikipedia.org/wiki/Currying
*/

/*
    So we can rewrite g to
    const g = (b: B) => (c: C) => D;

    What we want is a lifting operation, let't call it liftA2 in order to distinguish
    it from our old lift, that outputs a function with the following signature

    liftA2(g): (fb: F<B>) => (fc: F<C>) => F<D>

    How can we get there? Since g is now unary, we can use the functor instance and our old lift

    lift(g): (fb: F<B>) => F<(c: C) => D>

    But now we are stuck: there's no legal operation on the functor instance which is
    able to unpack the value F<(c: C) => D> to a function (fc: F<C>) => F<D>.
*/

//////////////////////////////
//          APPLY
//////////////////////////////

import { Functor } from 'fp-ts/lib/Functor';
import { HKT, Kind, URIS } from 'fp-ts/lib/HKT';

// So let's introduce a new abstraction Apply that owns such a unpacking operation (named ap)
interface Apply<F> extends Functor<F> {
	ap: <C, D>(fcd: HKT<F, (c: C) => D>, fc: HKT<F, C>) => HKT<F, D>;
}

/*
    The ap function is basically unpack with the arguments rearranged

    unpack: <C, D>(fcd: HKT<F, (c: C) => D>) => ((fc: HKT<F, C>) => HKT<F, D>)
    ap:     <C, D>(fcd: HKT<F, (c: C) => D>, fc: HKT<F, C>) => HKT<F, D>

    so ap can be derived from unpack (and viceversa).
    Note: the HKT type is the fp-ts way to represent a generic type constructor
    (a technique proposed in the Lightweight higher-kinded polymorphism paper)
    https://www.cl.cam.ac.uk/~jdy22/papers/lightweight-higher-kinded-polymorphism.pdf
    so when you see HKT<F, X> you can think to the type constructor F applied to the type X (i.e. F<X>).
*/

/*
    APPLICATIVE

    Moreover it would be handy if there exists an operation which is able to lift a
    value of type A to a value of type F<A>. This way we could call the liftA2(g)
    function either by providing arguments of type F<B> and F<C> or by lifting values of type B and C.
    So let's introduce the Applicative abstraction which builds upon Apply and owns such operation (named of)
*/
interface Applicative<F> extends Apply<F> {
	of: <A>(a: A) => HKT<F, A>;
}

// Applicative instances for some common data types
import { flatten } from 'fp-ts/lib/Array';
import logger from './utils/logger';

// Example (F = Array)
const applicativeArray = {
	map: <A, B>(fa: Array<A>, f: (a: A) => B): Array<B> => fa.map(f),
	of: <A>(a: A): Array<A> => [a],
	ap: <A, B>(fab: Array<(a: A) => B>, fa: Array<A>): Array<B> => flatten(fab.map((f) => fa.map(f))),
};

logger.info(
	'applicativeArray.map<string, number>(["hello", "world"], (str) => str.length)',
	applicativeArray.map<string, number>(['hello', 'world!'], (str) => str.length)
); // [5, 6]

logger.info(
	'applicativeArray.ap<string, number>([(st) => st.length], ["hello", "world"]): ',
	applicativeArray.ap<string, number>([(st) => st.length, (st) => st.length + 1], ['hello', 'world!'])
); // [5, 6, 6, 7]

// Example (F = Option)
import { Option, some, none, isNone } from 'fp-ts/lib/Option';

const applicativeOption = {
	map: <A, B>(fa: Option<A>, f: (a: A) => B): Option<B> => (isNone(fa) ? none : some(f(fa.value))),
	of: <A>(a: A): Option<A> => some(a),
	ap: <A, B>(fab: Option<(a: A) => B>, fa: Option<A>): Option<B> =>
		isNone(fab) ? none : applicativeOption.map(fa, fab.value),
};

logger.info(
	'applicativeOption.map<string, number>(some("Lean"), (st) => st.length)',
	applicativeOption.map<string, number>(some('Lean'), (st) => st.length)
); // some(4)

logger.info(
	'applicativeOption.map<string, number>(some("Lean"), (st) => st.length)',
	applicativeOption.map<string, number>(none, (st) => st.length)
); // none

// Example (F = Task)
import { Task } from 'fp-ts/lib/Task';

const applicativeTask = {
	map: <A, B>(fa: Task<A>, f: (a: A) => B): Task<B> => () => fa().then(f),
	of: <A>(a: A): Task<A> => () => Promise.resolve(a),
	ap: <A, B>(fab: Task<(a: A) => B>, fa: Task<A>): Task<B> => () => Promise.all([fab(), fa()]).then(([f, a]) => f(a)),
};

///////////////////////////////////////
//      Lifting
///////////////////////////////////////

import { Apply1 } from 'fp-ts/lib/Apply';
import * as Array from 'fp-ts/lib/Array';
import * as Task2 from 'fp-ts/lib/Task';
import * as Option2 from 'fp-ts/lib/Option';
type Curried2<B, C, D> = (b: B) => (c: C) => D;
export function liftA2<F extends URIS>(
	F: Apply1<F>
): <B, C, D>(g: Curried2<B, C, D>) => Curried2<Kind<F, B>, Kind<F, C>, Kind<F, D>> {
	return (g) => (fb) => (fc) => F.ap(F.map(fb, g), fc);
}
const liftA2Array = liftA2(Array.array);
const liftA2Task = liftA2(Task2.task);
const liftA2Option = liftA2(Option2.option);
