import { ReducerMaybeWithSideEffects } from "./SideEffect";


/**
 * A redux action. 
 */
export interface Action { type?: string };

/**
 * A redux reducer.
 */
export interface Reducer<S> { (state: S, action: Action): S };

/**
 * A map of reducers to pass to combineReducers.
 */
export type ReducerMap<S> = {
  [P in keyof S]?: ReducerMaybeWithSideEffects<S[P]>;
};


export type DeepReducerMap<S> = {
  [P in keyof S]?: ReducerMaybeWithSideEffects<S[P]> | DeepReducerMap<S[P]> | ReducerMaybeWithSideEffects<S[P]>[] | DeepReducerMap<S[P]>[];
};

