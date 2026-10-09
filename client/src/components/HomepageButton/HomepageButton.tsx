import clsx from "clsx";
import { memo, type FC, type MouseEventHandler } from "react";
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

export const HomepageButton: FC<HomepageButtonProps> = memo(
	({
		className,
		hidden,
		children,
		onClick,
		thinkingId,
		currentThinkingId,
		setCurrentThinkingId,
		...rest
	}) => {
		const hasID = thinkingId !== undefined;
		const handleClick = useCallbackStable<MouseEventHandler<HTMLButtonElement>>((e) => {
			if (hasID) setCurrentThinkingId(thinkingId);
			return onClick?.(e);
		});

		return (
			<AsyncButton
				className={clsx("HomepageButton", className, classes.root)}
				onClick={handleClick}
				disabled={currentThinkingId !== undefined}
				forceThinking={hasID && thinkingId === currentThinkingId}
				{...rest}
			>
				{children}
			</AsyncButton>
		);
	}
);
