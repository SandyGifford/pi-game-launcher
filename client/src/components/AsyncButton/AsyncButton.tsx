import type { Fn, PromisifyProps } from "@repo/shared";
import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef, memo, useEffect } from "react";
import { useCallbackStable, useInUse } from "../../hooks";
import classes from "./AsyncButton.module.scss";

export type AsyncButtonThinkingChangeHandler = (thinking: boolean) => unknown;

export type AsyncButtonProps = PromisifyProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onClick" | "onMouseDown" | "onMouseUp" | "onTouchStart" | "onTouchEnd"
> & {
	readonly forceThinking?: boolean;
	readonly permaThink?: boolean | number;
	readonly onThinkingChange?: AsyncButtonThinkingChangeHandler;
};

export const AsyncButton = memo(
	forwardRef<HTMLButtonElement, AsyncButtonProps>(
		(
			{
				className,
				disabled,
				onClick,
				onMouseDown,
				onMouseUp,
				onTouchStart,
				onTouchEnd,
				forceThinking,
				permaThink,
				onThinkingChange,
				children,
				...rest
			},
			ref
		) => {
			const { inUse: thinking, reserveWhile: thinkWhile } = useInUse({
				forceInUse: forceThinking,
				permaInUse: permaThink,
			});

			const handlePromisifiedHandler = <FN extends Fn>(fn: FN | undefined): FN | undefined =>
				fn && ((async (...args: readonly never[]) => thinkWhile(() => fn(...args))) as FN);

			const onThinkingChangeStable = useCallbackStable(onThinkingChange || (() => void 0));
			useEffect(() => {
				onThinkingChangeStable(thinking);
			}, [onThinkingChangeStable, thinking]);

			return (
				<button
					className={clsx(
						"AsyncButton",
						className,
						classes.root,
						thinking && classes["root--thinking"]
					)}
					ref={ref}
					disabled={disabled || thinking}
					onClick={handlePromisifiedHandler(onClick)}
					onMouseDown={handlePromisifiedHandler(onMouseDown)}
					onMouseUp={handlePromisifiedHandler(onMouseUp)}
					onTouchStart={handlePromisifiedHandler(onTouchStart)}
					onTouchEnd={handlePromisifiedHandler(onTouchEnd)}
					{...rest}
				>
					{children}
				</button>
			);
		}
	)
);
