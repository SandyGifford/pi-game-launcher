import type { Fn, PromisifyProps } from "@repo/shared";
import clsx from "clsx";
import type { ButtonHTMLAttributes, FC } from "react";
import { memo, useState } from "react";
import classes from "./AsyncButton.module.scss";

export type AsyncButtonProps = PromisifyProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onClick" | "onMouseDown" | "onMouseUp" | "onTouchStart" | "onTouchEnd"
>;

export const AsyncButton: FC<AsyncButtonProps> = memo(
	({ className, disabled, onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, ...rest }) => {
		const [thinkingCount, setThinkingCount] = useState(0);
		const thinking = !!thinkingCount;

		const handlePromisifiedHandler = <FN extends Fn>(fn: FN | undefined): FN | undefined =>
			fn &&
			((async (...args: readonly never[]) => {
				setThinkingCount((count) => count + 1);
				try {
					return await fn(...args);
				} finally {
					setThinkingCount((count) => count - 1);
				}
			}) as FN);

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
