import clsx from "clsx";
import { forwardRef, memo, useEffect, useRef, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import { AsyncButton, type AsyncButtonProps } from "../../../AsyncButton/AsyncButton";
import { useGroupThink, useGroupThinkRow } from "../../group-think.ctx";
import classes from "./GroupThinkButton.module.scss";

export type GroupThinkButtonThinkingID = string;

export type GroupThinkButtonProps = OverrideProperties<
	AsyncButtonProps,
	{
		readonly hidden?: boolean;
	}
> & {
	readonly thinkingId?: GroupThinkButtonThinkingID;
};

export const GroupThinkButton = memo(
	forwardRef<HTMLButtonElement, GroupThinkButtonProps>(
		({ className, hidden, children, onClick, thinkingId, ...rest }, ref) => {
			const { currentThinkingId, setCurrentThinkingId } = useGroupThink();
			const { addRef, removeRef } = useGroupThinkRow();
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
					className={clsx("GroupThinkButton", className, classes.root)}
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

GroupThinkButton.displayName = "GroupThinkButton";
