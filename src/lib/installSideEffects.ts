import { SideEffect, ReducerMaybeWithSideEffects, hasSideEffect } from './SideEffect';
import { Effector } from './Effector';
import { isMultipleSideEffects, multipleSideEffects } from './MultipleSideEffects';
import TaskList from './TaskList';
import { Reducer, Action } from './redux';
import { OneOrMany } from './util';
import * as flatten from 'lodash.flatten';
import { isDispatchAction } from './DispatchActionEffect';

/**
 * Redux enhancer to install the side effect handling code.
 */
export function installSideEffects(...effectors: Effector[]) {
  return (next) => (reducer, initialModel) => {
    let sideEffects: SideEffect[] = [];

    const effector = createEffector(
      [
        ...effectors,

        (effect: SideEffect) => {
          if (isMultipleSideEffects(effect)) {
            return new TaskList(
                effect.sideEffects.map(
                  (effect) => () => effector(effect)
                ),
                effect.serial
              )
              .map((action) => void dispatchArray(action))
              .run()
              .then(() => null);
            
          } else if (isDispatchAction(effect)) {
            return effect.actions;
            
          } else {
            return null;
          }
        }
      ],

      dispatchArray
    );

    function wrap<S>(reducer: ReducerMaybeWithSideEffects<S>): Reducer<S> {
      return <A extends Action>(state: S, action: A): S => {
        let result = reducer(state, action);

        if (hasSideEffect<S>(result)) {
          let [newState, sideEffect] = result;
          sideEffects.push(sideEffect);
          return result[0];

        } else {
          return result;
        }
      }
    }

    let store = next(wrap(reducer), initialModel);

    function dispatch(action) {
      store.dispatch(action);

      if (sideEffects.length) {
        const effect = sideEffects.length === 1 ? sideEffects[0] : multipleSideEffects(sideEffects);
        sideEffects = [];

        return effector(effect);
      }

      return Promise.resolve();
    }

    function dispatchArray(actions: OneOrMany<Action>) {
      if (Array.isArray(actions)) {
        return flatten(actions).forEach((action) => action && dispatch(action));

      } else if (actions) {
        return dispatch(actions);
      }
    }

    function replaceReducer(reducer) {
      return store.replaceReducer(wrap(reducer))
    }

    return {
      ...store,
      dispatch,
      replaceReducer,
    };
  };
};

function createEffector(effectors: Effector[], dispatch: (actions: OneOrMany<Action>) => any) {
  return function effector(effect: SideEffect): Promise<any> {
    return new TaskList(
        effectors.map(
          (effector) => () => effector(effect)
        ),
        true
      )
      .map((action) => void dispatch(action))
      .run();
  };
}