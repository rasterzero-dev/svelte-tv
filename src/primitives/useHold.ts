export type UseHoldProps = {
  onHold: () => void;
  onEnter: () => void;
  onRelease?: () => void;
  holdThreshold?: number;
  performOnEnterImmediately?: boolean;
};

export function useHold(props: UseHoldProps) {
  let holdTimeout = -1;
  let enterFired = false;
  let holdFired = false;
  let repeated = false;

  const reset = () => {
    if (holdTimeout !== -1) {
      clearTimeout(holdTimeout);
      holdTimeout = -1;
    }
    enterFired = false;
    holdFired = false;
    repeated = false;
  };

  const startHold = (e?: KeyboardEvent) => {
    if (e?.repeat) {
      repeated = true;
      return true;
    }

    reset();

    if (props.performOnEnterImmediately) {
      enterFired = true;
      props.onEnter();
    }

    holdTimeout = setTimeout(() => {
      holdTimeout = -1;
      if (repeated) {
        holdFired = true;
        props.onHold();
      } else if (!enterFired) {
        enterFired = true;
        props.onEnter();
      }
    }, props.holdThreshold ?? 500) as unknown as number;

    return true;
  };

  const releaseHold = () => {
    if (holdTimeout !== -1) {
      clearTimeout(holdTimeout);
      holdTimeout = -1;
      if (!enterFired) {
        enterFired = true;
        props.onEnter();
      }
    } else if (holdFired) {
      props.onRelease?.();
    }
    reset();
    return true;
  };

  return [startHold, releaseHold] as const;
}

export default useHold;
