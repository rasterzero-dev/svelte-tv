export type AnyFunction = (this: any, ...args: any[]) => any;
export type Ref<T> = (value: T) => void;

export function chainFunctions<T extends AnyFunction>(...fns: T[]): T;
export function chainFunctions<T extends AnyFunction>(
  ...fns: (T | undefined | null | false)[]
): T | undefined;
export function chainFunctions(
  ...fns: (AnyFunction | undefined | null | false)[]
): AnyFunction | undefined {
  let first: AnyFunction | undefined;
  let onlyFunctions: AnyFunction[] | undefined;
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i];
    if (typeof fn !== 'function') continue;
    if (first === undefined) {
      first = fn;
    } else {
      if (onlyFunctions === undefined) onlyFunctions = [first];
      onlyFunctions.push(fn);
    }
  }

  if (first === undefined) return undefined;
  if (onlyFunctions === undefined) return first;

  if (onlyFunctions.length === 2) {
    const a = onlyFunctions[0]!;
    const b = onlyFunctions[1]!;
    return function (this: unknown, ...innerArgs) {
      const result = a.apply(this, innerArgs);
      if (result === true) return result;
      return b.apply(this, innerArgs);
    };
  }

  const chained = onlyFunctions;
  return function (this: unknown, ...innerArgs) {
    let result;
    for (let i = 0; i < chained.length; i++) {
      result = chained[i]!.apply(this, innerArgs);
      if (result === true) return result;
    }
    return result;
  };
}

export const chainRefs = chainFunctions as <T>(
  ...refs: (Ref<T> | undefined)[]
) => (el: T) => void;
