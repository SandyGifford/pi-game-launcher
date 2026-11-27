import clsx from "clsx";
import { forwardRef, memo, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../../../../hooks/useCallbackStable.hook";
import { useViewThinking } from "../../../../View/View.ctx";
import classes from "./ButtonGroupButton.module.scss";
import { AsyncButton, type AsyncButtonProps } from "../../../AsyncButton/AsyncButton";

export type ButtonGroupButtonThinkingID = string;

export type ButtonGroupButtonProps = OverrideProperties<
  AsyncButtonProps,
  {
    readonly hidden?: boolean;
  }
> & {
  readonly thinkingId?: ButtonGroupButtonThinkingID;
};

export const ButtonGroupButton = memo(
  forwardRef<HTMLButtonElement, ButtonGroupButtonProps>(
    ({ className, hidden, children, onClick, thinkingId, ...rest }, ref) => {
      const { currentThinkingId, setCurrentThinkingId } = useViewThinking();

      const hasID = thinkingId !== undefined;
      const handleClick = useCallbackStable<MouseEventHandler<HTMLButtonElement>>((e) => {
        if (hasID) setCurrentThinkingId(thinkingId);
        return onClick?.(e);
      });

      return (
        <AsyncButton
          className={clsx("ButtonGroupButton", className, classes.root)}
          ref={ref}
          onClick={handleClick}
          disabled={currentThinkingId !== undefined}
          forceThinking={hasID && thinkingId === currentThinkingId}
          {...rest}
        >
          {children}
        </AsyncButton>
      );
    }
  )
);

ButtonGroupButton.displayName = "ButtonGroupButton";
