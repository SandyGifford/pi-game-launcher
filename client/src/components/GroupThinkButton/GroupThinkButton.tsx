import clsx from "clsx";
import {
	createContext,
	forwardRef,
	memo,
	useContext,
	useMemo,
	type FC,
	type MouseEventHandler,
	type ReactNode,
} from "react";
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
};

export type GroupThinkCtx = {
	readonly currentThinkingId: GroupThinkButtonThinkingID | undefined;
	readonly setCurrentThinkingId: (id: GroupThinkButtonThinkingID) => void;
};

const ctx = createContext<GroupThinkCtx>({
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
});

export const GroupThinkProvider: FC<GroupThinkCtx & { readonly children: ReactNode }> = ({
	children,
	currentThinkingId,
	setCurrentThinkingId,
}) => (
	<ctx.Provider
		value={useMemo(
			() => ({
				currentThinkingId,
				setCurrentThinkingId,
			}),
			[currentThinkingId, setCurrentThinkingId]
		)}
	>
		{children}
	</ctx.Provider>
);

export const GroupThinkButton = memo(
	forwardRef<HTMLButtonElement, GroupThinkButton>(
		({ className, hidden, children, onClick, thinkingId, ...rest }, ref) => {
			const { currentThinkingId, setCurrentThinkingId } = useContext(ctx);
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
