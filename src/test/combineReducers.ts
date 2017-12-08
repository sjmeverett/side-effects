import test from 'ava';
import { combineReducers } from '../lib/combineReducers';
import { noSideEffect } from '../lib/NoSideEffect';
import { BuiltInEffect } from '../lib/BuiltInEffect';

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
        type: BuiltInEffect.Multiple,
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
        type: BuiltInEffect.Multiple,
        sideEffects: [
          {type: 'a effect'},
          {type: 'b effect'}
        ],
        serial: false
      }
    ]
  );
});
