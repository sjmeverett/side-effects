import { SideEffect } from './SideEffect';
import { ActionOrPromise } from './util';

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
