import { SideEffect } from "./SideEffect";
import { BuiltInEffect } from "./BuiltInEffect";

export interface NoSideEffect extends SideEffect {
  type: BuiltInEffect.None;
};


export function isNoSideEffect(effect: SideEffect): effect is NoSideEffect {
  return effect.type === BuiltInEffect.None;
};


export function noSideEffect() {
  return {
    type: BuiltInEffect.None
  };
};
