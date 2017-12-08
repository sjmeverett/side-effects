import { DeepReducerMap, ReducerMap, Action } from "./redux";
import { ReducerMaybeWithSideEffects, SideEffect, stripSideEffect } from "./SideEffect";
import { multipleSideEffects } from "./MultipleSideEffects";


function combineMap<S>(reducers: DeepReducerMap<S>): ReducerMaybeWithSideEffects<S> {
  const children: Partial<ReducerMap<S>> = {};

  for (let k in reducers) {
    const reducer = reducers[k];

    if (Array.isArray(reducer)) {
      children[k] = combineReducers(...reducer);
    } else if (typeof reducer === 'object') {
      children[k] = combineMap(reducer as any);
    }
  }

  const _reducers: ReducerMap<S> = {
    ...reducers as any,
    ...children as any
  };

  return <A extends Action>(state: S, action: A): [S, SideEffect] => {
    let result = Object.assign({}, state);
    let sideEffects: SideEffect[] = [];
    state = state || <S>{};

    for (let k in reducers) {
      result[k] = stripSideEffect(_reducers[k](state[k], action), sideEffects);
    }

    return [result, multipleSideEffects(sideEffects)];
  };
};

/**
 * A side-effect-aware replacement for Redux's combineReducers function.
 */
export function combineReducers<S>(...reducers: (Partial<DeepReducerMap<S>> | ReducerMaybeWithSideEffects<S>)[]): ReducerMaybeWithSideEffects<S> {
  let _reducers = reducers.map(
    (reducer) => typeof reducer === 'object' ? combineMap<any>(reducer) : reducer
  );

  if (_reducers.length === 1) {
    return _reducers[0];

  } else {
    return <S, A extends Action>(state: S, action: A): [S, SideEffect] => {
      let sideEffects: SideEffect[] = [];

      for (let reducer of _reducers) {
        state = stripSideEffect(reducer(state, action), sideEffects);
      }

      return [state, multipleSideEffects(sideEffects)];
    };
  }
};
