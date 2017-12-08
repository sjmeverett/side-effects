import { Action } from "./redux";

/**
 * A thing or array of things.
 */
export type OneOrMany<T> = T | T[];

/**
 * A thing or a promise of a thing.
 */
export type MaybeAsync<T> = T | PromiseLike<T>;

/**
 * Determines if the given value is a promise.
 * @param value 
 */
function isAsync<T>(value: MaybeAsync<T>): value is PromiseLike<T> {
  return value['then'];
}

/**
 * An action or array of actions, promised or immediate.
 */
export type ActionOrPromise = MaybeAsync<OneOrMany<Action>>;
