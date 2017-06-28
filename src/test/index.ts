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
      t.is(effect.type, 'multiple');
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


test('combineReducers', (t) => {
  let reducer = combineReducers({
    a(state, action) {
      return ['a: ' + state, {type: 'a effect'}];
    },

    b(state, action) {
      return ['b: ' + state, {type: 'b effect'}];
    }
  });

  t.deepEqual<any>(
    reducer({a: 1, b: 2}, null),
    [
      {
        a: 'a: 1',
        b: 'b: 2'
      },
      {
        type: 'multiple',
        sideEffects: [
          {type: 'a effect'},
          {type: 'b effect'}
        ],
        serial: false
      }
    ]
  );
});


test('combineReducers with legacy', (t) => {
  let reducer = combineReducers({
    a(state, action) {
      return ['a: ' + state, {type: 'a effect'}];
    },

    b(state, action) {
      return 'b: ' + state;
    }
  });

  t.deepEqual<any>(
    reducer({a: 1, b: 2}, null),
    [
      {
        a: 'a: 1',
        b: 'b: 2'
      },
      {
        type: 'a effect'
      }
    ]
  );
});


test('combineReducers with undefined state', (t) => {
  let reducer = combineReducers({
    a(state, action) {
      return 'a';
    },

    b(state, action) {
      return 'b';
    }
  });

  t.deepEqual<any>(
    reducer(undefined, null),
    [
      {
        a: 'a',
        b: 'b'
      }, 
      noSideEffect()
    ]
  );
});


test('combineReducers deep', (t) => {
  interface C {
    a: any;
    b: any;
  }
  interface State {
    c: C
  }

  let reducer = combineReducers<State>(
    {
      c: {
        a(state: C, action) {
          return ['a: ' + state, {type: 'a effect'}];
        }
      }
    },
    {
      c: [{
        b(state, action) {
          return ['b: ' + state, {type: 'b effect'}];
        }
      }]
    }
  );

  t.deepEqual<any>(
    reducer({c: {a: 1, b: 2}}, null),
    [
      {
        c: {
          a: 'a: 1',
          b: 'b: 2'
        }
      },
      {
        type: 'multiple',
        sideEffects: [
          {type: 'a effect'},
          {type: 'b effect'}
        ],
        serial: false
      }
    ]
  );
});
