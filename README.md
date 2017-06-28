# side-effects

Adds side-effects to redux, heavily inspired by [redux-loop](https://www.npmjs.com/package/redux-loop).
I rewrote it because of the lack of documentation, the lack of typescript definitions, and the fact that
testability has been dropped.

The only reason why you'd want to return a side effect from your reducer rather than just making a side effect
happen is so that you can test them.  This library also decouples the effect result from the description of the
effect. 

## Installation

    $ yarn add side-effects

## Example

Here is a fairly contrived example for illustration:

```js
import { createStore } from 'redux';
import { installSideEffects } from 'side-effects';

function effector(effect) {
  switch (effect.type) {
    case 'RANDOM':
      return {type: 'RANDOM_AVAILABLE', n: Math.random()};
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'MAKE_RANDOM':
      return [state, {type: 'RANDOM'}];

    default:
      return state;
  }
}

const store = createStore(reducer, installSideEffects(effector));
```

To make a side effect, just return a tuple, with the new state as the first element and the side
effect as the second.  You can return more than one side effect by returning an array as the 2nd
element of the tuple.


## API

### `installSideEffects(effector: Effector)`

Returns an enhancer to pass to `createStore`.  The `effector` is a function which makes the side
effect happen.  It's much like a reducer in that it'll probably do a switch on the effect type, but
it returns an action or a promise for an action.

### `hasSideEffect(obj)`

Determines if the given object has a side effect (duck typing, can't know for sure).

### `combineReducers(...reducers: (Partial<DeepReducerMap<S>> | ReducerWithSideEffects<S>)[]): ReducerWithSideEffects<S>`

Replaces redux's combineReducers - this one is side effect aware.  It can accept an aribtrarily deep nesting of reducer maps and multiple arguments,
either reducer functions or more maps.

### `noSideEffect()`

Creates a dummy side effect with `type` equal to `'none'`, in case you want to keep your reducers consistent.

### `multipleSideEffects(sideEffects: SideEffect[], serial=false)`

Creates a side effect which represents multiple other side effects.  If `serial` is true, the effects will be run in serial.
