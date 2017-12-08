import { SideEffect } from "./SideEffect";
import { noSideEffect } from "./NoSideEffect";
import { BuiltInEffect } from "./BuiltInEffect";


export interface MultipleSideEffects extends SideEffect {
  type: BuiltInEffect.Multiple;
  sideEffects: SideEffect[];
  serial: boolean;
};


export function isMultipleSideEffects(effect: SideEffect): effect is MultipleSideEffects {
  return effect.type === BuiltInEffect.Multiple;
};


export function multipleSideEffects<T extends SideEffect>(sideEffects: T[], serial=false) {
  if (sideEffects.length === 0) {
    return noSideEffect();

  } else if (sideEffects.length === 1) {
    return sideEffects[0];

  } else {
    return {
      type: BuiltInEffect.Multiple,
      sideEffects,
      serial
    };
  }
};