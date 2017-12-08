import { Action } from "./redux";

/**
 * A description of a side effect.
 */
export interface SideEffect {
  /**
   * A string stating the type of side effect.
   */
  type?: string;
};

/**
 * A Redux reducer function which may return side effects.
 */
export interface ReducerMaybeWithSideEffects<S> {
  <A extends Action>(state: S, action: A): MaybeHasSideEffect<S>;
};

/**
 * A reducer can return a side effect alongside the new state using this tuple type.
 */
export type HasSideEffect<S> = [S, SideEffect];

/**
 * The result from a reducer: either a state and side effect, or just a state.
 */
export type MaybeHasSideEffect<S> = HasSideEffect<S> | S;


/**
 * Returns true if the specified object is probably a HasSideEffect tuple; otherwise, false.
 */
export function hasSideEffect<S>(obj): obj is HasSideEffect<S> {
  return Array.isArray(obj)
    && obj.length === 2
    && typeof obj[1].type === 'string';
};

/**
 * Strips the side effect from a router result, if there is one.
 * @param result 
 * @param sideEffects 
 */
export function stripSideEffect<S>(result: S | HasSideEffect<S>, sideEffects: SideEffect[]): S {
  if (hasSideEffect(result)) {
    let [state, sideEffect] = result;
    sideEffects.push(sideEffect);
    return state;

  } else {
    return result;
  }
};
