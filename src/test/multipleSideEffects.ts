import { test } from "ava";
import { multipleSideEffects } from "../lib/MultipleSideEffects";
import { createStore } from "redux";
import { installSideEffects } from "../lib/installSideEffects";
import { BuiltInEffect } from "../lib/BuiltInEffect";


test('multiple side effects', async (t) => {
  t.plan(4);

  let state = {
    todos: []
  };

  function reducer(state, action) {
    if (action.type === 'ADD_TODO') {
      return [
        {
          todos: [...state.todos, {text: action.text}]
        },

        multipleSideEffects([
          {type: 'TEST_EFFECT'},
          {type: 'TEST_EFFECT'}
        ])
      ];
    } else {
      return state;
    }
  }

  let first = true;

  let store = createStore(reducer, state, installSideEffects((effect) => {
    if (first) {
      t.is(effect.type, BuiltInEffect.Multiple);
      first = false;

    } else {
      t.is(effect.type, 'TEST_EFFECT');
    }

    return null;
  }));

  await store.dispatch({type: 'ADD_TODO', text: 'hello, world'});
  t.deepEqual(store.getState().todos, [{text: 'hello, world'}]);
});


test('multiple side effects (serial)', async (t) => {
  let state = {};
  let numbers = [];

  function reducer(state, action) {
    if (action.type === 'TRIGGER') {
      return [
        state,
        multipleSideEffects([
          {type: 'wait', interval: 300},
          {type: 'wait', interval: 150},
          {type: 'wait', interval: 200},
        ], true)
      ];

    } else {
      return state;
    }
  }

  let store = createStore(reducer, state, installSideEffects((effect: any) => {
    if (effect.type === 'wait') {
      return new Promise((resolve) => setTimeout(resolve, effect.interval))
        .then(() => void numbers.push(effect.interval));
    }
  }));

  await store.dispatch({type: 'TRIGGER'});
  await new Promise((resolve) => setTimeout(resolve, 700));
  t.deepEqual(numbers, [300, 150, 200]);
});

