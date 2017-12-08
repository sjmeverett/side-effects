import test from 'ava';
import { createStore } from 'redux';
import { installSideEffects, Effector, SideEffect, combineReducers, noSideEffect, multipleSideEffects } from '../lib';


test('side effects', async (t) => {
  t.plan(2);

  let state = {
    todos: []
  };

  function reducer(state, action) {
    if (action.type === 'ADD_TODO') {
      return [Object.assign({}, state, {
        todos: [...state.todos, {text: action.text}]
      }), {type: 'TEST_EFFECT'}];
    } else {
      return state;
    }
  }

  let store = createStore(reducer, state, installSideEffects((effect) => {
    t.is(effect.type, 'TEST_EFFECT');
    return Promise.resolve({type: 'DUMMY'});
  }));

  await store.dispatch({type: 'ADD_TODO', text: 'hello, world'});
  t.deepEqual(store.getState().todos, [{text: 'hello, world'}]);
});

