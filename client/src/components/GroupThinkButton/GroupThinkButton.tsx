import clsx from "clsx";
import { forwardRef, memo, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { AsyncButton, type AsyncButtonProps } from "../AsyncButton/AsyncButton";
import classes from "./GroupThinkButton.module.scss";

export type GroupThinkButtonThinkingID = string;

export type GroupThinkButton = OverrideProperties<
	AsyncButtonProps,
	{
		readonly hidden?: boolean;
	}
> & {
	readonly thinkingId?: GroupThinkButtonThinkingID;
	readonly setCurrentThinkingId: (id: GroupThinkButtonThinkingID) => unknown;
	readonly currentThinkingId: GroupThinkButtonThinkingID | undefined;
};

export const GroupThinkButton = memo(
	forwardRef<HTMLButtonElement, GroupThinkButton>(
		(
			{
				className,
				hidden,
				children,
				onClick,
				thinkingId,
				currentThinkingId,
				setCurrentThinkingId,
				...rest
			},
			ref
		) => {
			const hasID = thinkingId !== undefined;
			const handleClick = useCallbackStable<MouseEventHandler<HTMLButtonElement>>((e) => {
				if (hasID) setCurrentThinkingId(thinkingId);
				return onClick?.(e);
			});

			return (
				<AsyncButton
					className={clsx("GroupThinkButton", className, classes.root)}
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
