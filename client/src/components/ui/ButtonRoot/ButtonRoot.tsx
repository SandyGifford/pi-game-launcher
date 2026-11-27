import { useMergedRef } from "@mantine/hooks";
import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { useViewIsReady, useViewReadyTransitionStatus } from "../../View/View.ctx";
import classes from "./ButtonRoot.module.scss";

export type ButtonRootProps = ComponentPropsWithoutRef<"button">;

export const ButtonRoot = forwardRef<HTMLButtonElement, ButtonRootProps>(
	({ children, className, style, ...rest }, ref) => {
		const internalRef = useRef<HTMLButtonElement>(null);
		const [origin, setOrigin] = useState<{ readonly x: number; readonly y: number }>();
		const viewIsReady = useViewIsReady();
		const transitionStatus = useViewReadyTransitionStatus();

		useLayoutEffect(() => {
			const button = internalRef.current;
			if (!button) return;
			const { innerWidth, innerHeight } = window;
			const { top, left } = button.getBoundingClientRect();

			setOrigin({ x: innerWidth / 2 - left, y: innerHeight / 2 - top });
		}, [viewIsReady]);

		return (
			<button
				ref={useMergedRef(internalRef, ref)}
				className={clsx(
					"ButtonRoot",
					className,
					classes.root,
					classes[`root--${transitionStatus}`]
				)}
				style={{
					...style,
					...(origin && {
						"--ButtonRoot-transform-origin-x": `${origin.x}px`,
						"--ButtonRoot-transform-origin-y": `${origin.y}px`,
					}),
				}}
				{...rest}
			>
				{children}
			</button>
		);
	}
);

ButtonRoot.displayName = "ButtonRoot";
