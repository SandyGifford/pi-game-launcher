import clsx from "clsx";
import type { FC, ReactElement } from "react";
import { isValidElement, memo, useState } from "react";
import { AutoRefTransition } from "../../../ui/AutoRefTransition/AutoRefTransition";
import type { InjectableTransitionProps } from "../../../ui/TransitionInjector/TransitionInjector";
import { useAnimatedListItem } from "../../animated-list.ctx";
import classes from "./AnimatedListItem.module.scss";

export type AnimatedListItemProps = {
	readonly listKey?: string;
	readonly fixedHeight?: number;
	readonly durationMS?: number;
} & InjectableTransitionProps &
	React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;

export const AnimatedListItem: FC<AnimatedListItemProps> = memo(
	({
		className,
		children,
		listKey,
		fixedHeight,
		style,
		durationMS = 500,
		in: inProp,
		onExited,
		appear,
		enter,
		exit,
		...rest
	}) => {
		const [el, setEl] = useState<HTMLDivElement | null>(null);
		useAnimatedListItem(listKey, el);

		return (
			<AutoRefTransition
				timeout={durationMS}
				in={inProp}
				onExited={onExited}
				appear={appear}
				enter={enter}
				exit={exit}
			>
				{(state) => (
					<li
						className={clsx("AnimatedListItem", className, classes.root, classes[`root--${state}`])}
						style={{
							"--AnimatedListitem--fixed-height": `${fixedHeight}px`,
							"--AnimatedListitem--duration": `${durationMS}ms`,
							...style,
						}}
						{...rest}
					>
						<div className={classes.inner} ref={setEl}>
							{children}
						</div>
					</li>
				)}
			</AutoRefTransition>
		);
	}
);

export const isAnimatedListItemElement = (el: unknown): el is ReactElement<AnimatedListItemProps> =>
	isValidElement(el) && el.type === AnimatedListItem;
