import type { Fn, PromisifyProps } from "@repo/shared";
import clsx from "clsx";
import type { ButtonHTMLAttributes, FC } from "react";
import { memo, useEffect } from "react";
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

export const AsyncButton: FC<AsyncButtonProps> = memo(
	({
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
		...rest
	}) => {
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
				className={clsx(className, classes.root, thinking && classes["root--thinking"])}
				disabled={disabled || thinking}
				onClick={handlePromisifiedHandler(onClick)}
				onMouseDown={handlePromisifiedHandler(onMouseDown)}
				onMouseUp={handlePromisifiedHandler(onMouseUp)}
				onTouchStart={handlePromisifiedHandler(onTouchStart)}
				onTouchEnd={handlePromisifiedHandler(onTouchEnd)}
				{...rest}
			></button>
		);
	}
);
