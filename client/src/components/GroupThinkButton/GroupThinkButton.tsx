import clsx from "clsx";
import { forwardRef, memo, useContext, type MouseEventHandler } from "react";
import type { OverrideProperties } from "type-fest";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";
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

const [ctx, GroupThinkProvider] = createQuickCtx<GroupThinkCtx>("GroupThink", {
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
})(["currentThinkingId", "setCurrentThinkingId"]);

export { GroupThinkProvider };

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

GroupThinkButton.displayName = "GroupThinkButton";
