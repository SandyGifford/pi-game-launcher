import clsx from "clsx";
import { forwardRef, memo, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../hooks";
import { AsyncButton, type AsyncButtonProps } from "../AsyncButton/AsyncButton";
import classes from "./HomepageButton.module.scss";

export type HomepageButtonThinkingID = string;

export type HomepageButtonProps = OverrideProperties<
	AsyncButtonProps,
	{
		readonly hidden?: boolean;
	}
> & {
	readonly thinkingId?: HomepageButtonThinkingID;
	readonly setCurrentThinkingId: (id: HomepageButtonThinkingID) => unknown;
	readonly currentThinkingId: HomepageButtonThinkingID | undefined;
};

export const HomepageButton = memo(
	forwardRef<HTMLButtonElement, HomepageButtonProps>(
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
					className={clsx("HomepageButton", className, classes.root)}
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
