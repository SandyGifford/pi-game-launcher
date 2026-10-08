import type { Fn, PromisifyProps } from "@repo/shared";
import clsx from "clsx";
import type { ButtonHTMLAttributes, FC } from "react";
import { memo, useEffect, useRef, useState } from "react";
import classes from "./AsyncButton.module.scss";
import { useIsMountedRef } from "../../hooks";

export type AsyncButtonErrorHandler = (e: unknown) => unknown;

export type AsyncButtonProps = PromisifyProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onClick" | "onMouseDown" | "onMouseUp" | "onTouchStart" | "onTouchEnd"
> & {
	readonly forceThinking?: boolean;
	readonly permaThink?: boolean | number;
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
		...rest
	}) => {
		const [thinkingCount, setThinkingCount] = useState(0);
		const hasThoughtRef = useRef(false);
		const thinking =
			!!thinkingCount || forceThinking || (permaThink === true && hasThoughtRef.current);

		const isMountedRef = useIsMountedRef();

		const think = () => setThinkingCount((count) => count + 1);
		const unthink = (noDelay?: boolean) =>
			new Promise<void>((res) =>
				setTimeout(
					() => {
						if (!isMountedRef.current) return;
						setThinkingCount((count) => count - 1);
            res();
					},
					!noDelay && typeof permaThink === "number" ? permaThink : 0
				)
			);

		const handlePromisifiedHandler = <FN extends Fn>(fn: FN | undefined): FN | undefined =>
			fn &&
			((async (...args: readonly never[]) => {
				think();
				try {
					const res = await fn(...args);
					hasThoughtRef.current = true;
					unthink();
					return res;
				} catch(e) {
					unthink(true);
          throw e;
				}
			}) as FN);

		useEffect(() => {
			if (permaThink !== true) hasThoughtRef.current = false;
		}, [permaThink]);

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
