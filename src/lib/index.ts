import * as flatten from 'lodash.flatten';

export type OneOrMany<T> = T | T[];
export type MaybeAsync<T> = T | PromiseLike<T>;
export interface Action { type?: string };
export interface Reducer<S> { (state: S, action: Action): S };
export type ActionOrPromise = MaybeAsync<OneOrMany<Action>>;

function isAsync<T>(val: MaybeAsync<T>): val is PromiseLike<T> {
  return val['then'];
}

/**
 * A function for making side effects happen.
 */
export interface Effector {
  /**
   * Make the side effect happen.
   * @param effect the side effect to make happen
   */
  (effect: SideEffect): ActionOrPromise
};

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
 * A map of reducers to pass to combineReducers.
 */
export type ReducerMap<S> = {
  [P in keyof S]?: ReducerMaybeWithSideEffects<S[P]>;
};


export type DeepReducerMap<S> = {
  [P in keyof S]?: ReducerMaybeWithSideEffects<S[P]> | DeepReducerMap<S[P]> | ReducerMaybeWithSideEffects<S[P]>[] | DeepReducerMap<S[P]>[];
};


export type PromiseOrValue<T> = PromiseLike<T> | T;


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


function stripSideEffect<S>(result: S | HasSideEffect<S>, sideEffects: SideEffect[]): S {
  if (hasSideEffect(result)) {
    let [state, sideEffect] = result;
    sideEffects.push(sideEffect);
    return state;

  } else {
    return result;
  }
};



export function combineMap<S>(reducers: DeepReducerMap<S>): ReducerMaybeWithSideEffects<S> {
  const children: Partial<ReducerMap<S>> = {};

  for (let k in reducers) {
    const reducer = reducers[k];

    if (Array.isArray(reducer)) {
      children[k] = combineReducers(...reducer);
    } else if (typeof reducer === 'object') {
      children[k] = combineMap(reducer);
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


export interface NoSideEffect extends SideEffect {
  type: 'none';
};


export function isNoSideEffect(effect: SideEffect): effect is NoSideEffect {
  return effect.type === 'none';
};


export function noSideEffect() {
  return {
    type: 'none'
  };
};


export interface MultipleSideEffects extends SideEffect {
  type: 'multiple';
  sideEffects: SideEffect[];
  serial: boolean;
};


export function isMultipleSideEffects(effect: SideEffect): effect is MultipleSideEffects {
  return effect.type === 'multiple';
};


export function multipleSideEffects<T extends SideEffect>(sideEffects: T[], serial=false) {
  if (sideEffects.length === 0) {
    return noSideEffect();

  } else if (sideEffects.length === 1) {
    return sideEffects[0];

  } else {
    return {
      type: 'multiple',
      sideEffects,
      serial
    };
  }
};


function runPromises<A>(serial: boolean, promiseFactories: (() => MaybeAsync<A>)[]): Promise<A[]>;
function runPromises<A, B>(serial: boolean, map: ((a: A) => B), promiseFactories: (() => MaybeAsync<A>)[]): Promise<B[]>;
function runPromises<A, B>(serial: boolean, mapOrFactories: ((a: A) => B) | (() => MaybeAsync<A>)[], maybePromiseFactories?: (() => MaybeAsync<A>)[]): Promise<A | B[]> {
  const map = Array.isArray(mapOrFactories)
    ? (a) => a
    : mapOrFactories;
  
  const factories = Array.isArray(mapOrFactories)
    ? mapOrFactories
    : maybePromiseFactories;

  const promiseFactories = factories.map(toAsync);

  return serial
    ? promiseFactories.reduce(
      (prev, next) => prev.then(
        (results) => [...results, next().then(map)]
      ),
      Promise.resolve([])
    )
    : Promise.all(promiseFactories.map((factory) => factory().then(map)));
}


function toAsync<A>(fn: () => MaybeAsync<A>): () => Promise<A> {
  return () => {
    try {
      return Promise.resolve(fn());
    } catch (err) {
      return Promise.reject(err);
    }
  }
}



type Task<T> = () => MaybeAsync<T>;
type AsyncTask<T> = () => Promise<T>;


class TaskList<T> {
  private _tasks: AsyncTask<T>[];

  constructor(tasks: Task<T>[], private serial=false) {
    this._tasks = tasks.map(toAsync);
  }


  async run(): Promise<T[]> {
    if (this.serial) {
      let results: T[] = [];

      for (let task of this._tasks) {
        let result = await task();
        results.push(result);
      }

      return results;
      
    } else {
      return Promise.all(
        this._tasks.map((task) => task())
      );
    }
  }


  map<B>(fn: (value: T, index?: number) => B): TaskList<B> {
    let result = new TaskList<B>([], this.serial);
    
    result._tasks = this._tasks.map(
      (task) => () => task().then(fn)
    );

    return result;
  }
}
