# side-effects

Adds side-effects to redux, heavily inspired by [redux-loop](https://www.npmjs.com/package/redux-loop).
I rewrote it because of the lack of documentation, the lack of typescript definitions, and the fact that
testability has been dropped.

The only reason why you'd want to return a side effect from your reducer rather than just making a side effect
happen is so that you can test them.  This library also decouples the effect result from the description of the
effect. 

## Installation

    $ yarn add side-effects

## Overview

A side effect is basically the equivalent of an action - that is, it is a description of behaviour.  The side-effect
equivalent of a reducer, the function that makes the side effect happen, is called an _effector_.

Effector functions make the side effects happen, and optionally return an action or a promise for an action (or actions).

You might find it useful to create side effect creator functions, similar to action creators.

## Example

Here is an example of a logging side effect:

```js
import { createStore } from 'redux';
import { installSideEffects } from 'side-effects';

function loggingEffector(effect) {
  switch (effect.type) {
    case 'LOG':
      console.log(effect.message);
      break;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'DO_A_THING':
      return [
        {...state, frobblesAligned: true},
        {type: 'LOG', message: 'frobbles aligned'}
      ];

    default:
      return state;
  }
}

const store = createStore(reducer, installSideEffects(loggingEffector));
```

To make a side effect, just return a tuple, with the new state as the first element and the side
effect as the second.

Here's a more useful example, using promises:

```js
import { createStore } from 'redux';
import { installSideEffects } from 'side-effects';

function apiEffector(effect) {
  switch (effect.type) {
    case 'GET':
      return fetch(effect.url)
        .then((response) => response.json())
        .then((result) => ({
          type: 'RESPONSE_READY',
          result
        }));
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_WIDGETS':
      return [
        {...state, loading: true},
        {type: 'GET', url: '/api/widgets'}
      ];

    case 'RESPONSE_READY':
      return {
        ...state,
        loading: false,
        widgets: action.result
      };

    default:
      return state;
  }
}

const store = createStore(reducer, installSideEffects(apiEffector));
```


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

Creates a side effect which represents multiple other side effects.  If `serial` is true, the effects will be run in serial; that is, the following ones will only run when previous
promises have resolved.

### `dispatchAction(...actions: Action[])`

A utility effect whose effector just immediately returns the action(s) passed.  Useful for dispatching other actions from a reducer.
