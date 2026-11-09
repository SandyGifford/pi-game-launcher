import clsx from "clsx";
import { forwardRef, memo, useEffect, useRef, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import { AsyncButton, type AsyncButtonProps } from "../../../AsyncButton/AsyncButton";
import { useButtonGroup, useButtonGroupRow } from "../../button-group.ctx";
import classes from "./ButtonGroupButton.module.scss";

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
			const { currentThinkingId, setCurrentThinkingId } = useButtonGroup();
			const { addRef, removeRef } = useButtonGroupRow();
			const internalRef = useRef<HTMLButtonElement>(null);

			const hasID = thinkingId !== undefined;
			const handleClick = useCallbackStable<MouseEventHandler<HTMLButtonElement>>((e) => {
				if (hasID) setCurrentThinkingId(thinkingId);
				return onClick?.(e);
			});

			useEffect(() => {
				addRef(internalRef);
				return () => removeRef(internalRef);
			}, [internalRef, addRef, removeRef]);

			return (
				<AsyncButton
					className={clsx("ButtonGroupButton", className, classes.root)}
					ref={(el) => {
						internalRef.current = el;
						if (!ref) return;
						switch (typeof ref) {
							case "function":
								ref(el);
								break;
							case "object":
								ref.current = el;
								break;
						}
					}}
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
