import { SideEffect } from './SideEffect';
import { Action } from './redux';
import { BuiltInEffect } from './BuiltInEffect';

export interface DispatchActionEffect extends SideEffect {
  type: BuiltInEffect.DispatchAction,
  actions: Action[]
}

export function isDispatchAction(effect: SideEffect): effect is DispatchActionEffect {
  return effect.type === BuiltInEffect.DispatchAction;
}

export const dispatchAction = (...actions: Action[]): DispatchActionEffect => ({
  type: BuiltInEffect.DispatchAction,
  actions
});
